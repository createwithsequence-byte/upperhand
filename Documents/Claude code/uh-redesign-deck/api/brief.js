// Brief intake. Forwards to email when RESEND_API_KEY is set in Vercel env;
// returns 501 otherwise so the page falls back to a prefilled mail compose.
export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "POST only" });
  const { name, email, business, problem, website } = req.body ?? {};
  if (website)
    return res.status(200).json({ ok: true, at: new Date().toISOString() });
  if (!name || !email || !business)
    return res.status(400).json({ error: "missing fields" });

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(501).json({ error: "mail not configured" });

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: "Upperhand Briefs <onboarding@resend.dev>",
      to: ["brief@getupperhand.io"],
      reply_to: email,
      subject: `Brief: ${business ?? name}`,
      text: `Name: ${name}\nEmail: ${email}\nBusiness: ${business ?? ""}\n\nThe problem:
${problem || "(no write-up; start from the business line)"}`,
    }),
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    console.warn("[BRIEF] resend failed", r.status, detail.slice(0, 200));
    return res.status(502).json({ error: "mail send failed" });
  }
  return res.status(200).json({ ok: true, at: new Date().toISOString() });
}
