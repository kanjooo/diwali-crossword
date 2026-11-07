/**
 * Vercel Serverless Function: GET /api/scores
 * Returns all quiz attempts from Supabase, newest first.
 */
export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Server not configured" });
  }

  try {
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
