/**
 * Vercel Serverless Function: POST /api/submit
 * Receives a completed quiz attempt from a student and saves it to Supabase.
 *
 * Body JSON:
 *   { name, className, schoolName, city, email, score, seconds }
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Server not configured" });
  }

  try {
    const { name, className, schoolName, city, email, score, seconds } = req.body || {};
    const details = {
      name: typeof name === "string" ? name.trim() : "",
      className: typeof className === "string" ? className.trim() : "",
      schoolName: typeof schoolName === "string" ? schoolName.trim() : "",
      city: typeof city === "string" ? city.trim() : "",
      email: typeof email === "string" ? email.trim() : "",
    };

    if (!details.name || !details.className || !details.schoolName || !details.city || !details.email || score === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const payload = {
      name: details.name,
      class_name: details.className,
      school_name: details.schoolName,
      city: details.city,
      email: details.email,
      score: Number(score),
      seconds: Number(seconds) || 0,
      submitted_at: new Date().toISOString(),
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/attempts`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Supabase error:", errorText);
      return res.status(500).json({ error: "Database insert failed" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("submit error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
