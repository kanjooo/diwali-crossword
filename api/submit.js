/**
 * Vercel Serverless Function: POST /api/submit
 * Receives a completed quiz attempt from a student and saves it to Supabase.
 *
 * Body JSON:
 *   { name, className, schoolName, email, score, seconds, certId }
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
    const { name, className, schoolName, email, score, seconds, certId } = req.body || {};

    if (!name || !className || !schoolName || !email || score === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const payload = {
      name,
      class_name: className,
      school_name: schoolName,
      email,
      score: Number(score),
      seconds: Number(seconds) || 0,
      cert_id: certId || "",
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
