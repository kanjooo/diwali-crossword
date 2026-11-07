/**
 * Vercel Serverless Function: GET /api/scores
 * Returns all quiz attempts for an authorised teacher, newest first.
 */
export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const allowedTeacherEmails = new Set(
    (process.env.TEACHER_EMAIL_ALLOWLIST || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );

  if (!supabaseUrl || !supabaseKey || allowedTeacherEmails.size === 0) {
    return res.status(500).json({ error: "Server not configured" });
  }

  try {
    const authorization = req.headers?.authorization || req.headers?.Authorization;
    const match = /^Bearer\s+(.+)$/i.exec(authorization || "");
    if (!match) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify the access token with Supabase Auth. Do not trust a user ID or role
    // sent by the browser.
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${match[1]}`,
      },
    });
    if (!userResponse.ok) {
      return res.status(401).json({ error: "Invalid or expired access token" });
    }

    const user = await userResponse.json();
    if (!user.email || !allowedTeacherEmails.has(user.email.toLowerCase())) {
      return res.status(403).json({ error: "Teacher access required" });
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/attempts?select=*&order=submitted_at.desc`,
      {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Supabase error:", errorText);
      return res.status(500).json({ error: "Database read failed" });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("scores error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
