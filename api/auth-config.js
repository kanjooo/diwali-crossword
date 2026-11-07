/**
 * Supplies only Supabase's public client settings to the teacher login page.
 * The service-role key and teacher allowlist never leave the server.
 */
export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: "Server not configured" });
  }

  return res.status(200).json({ supabaseUrl, supabaseAnonKey });
}
