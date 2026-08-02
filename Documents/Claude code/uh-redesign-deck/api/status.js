// Live portfolio check. Pings every deployment in THE RECORD server-side and
// reports real status; CDN-cached 30s so client polling never hammers anyone.
const SITES = [
  { k: "tf", url: "https://tf-site-alpha.vercel.app" },
  { k: "moo", url: "https://moo-v-night.vercel.app" },
  { k: "fit", url: "https://fisherfit-hub.vercel.app" },
  { k: "covered", url: "https://covered-nu.vercel.app" },
  { k: "counsel", url: "https://upperhand-counsel-demo.vercel.app" },
  { k: "mrd", url: "https://mr-ds-site.vercel.app" },
  { k: "shelf", url: "https://shelf-life-gregs-projects-7f874633.vercel.app" },
  { k: "goodgrief", url: "https://goodgrief-song.vercel.app" },
];

export default async function handler(req, res) {
  const sites = await Promise.all(
    SITES.map(async (s) => {
      const t0 = Date.now();
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 5000);
        const r = await fetch(s.url, { redirect: "follow", signal: ctrl.signal });
        clearTimeout(timer);
        return { k: s.k, up: r.ok, ms: Date.now() - t0 };
      } catch (err) {
        console.warn("[STATUS] check failed", s.k, err?.name);
        return { k: s.k, up: false, ms: Date.now() - t0 };
      }
    }),
  );
  res.setHeader("cache-control", "s-maxage=30, stale-while-revalidate=60");
  return res.status(200).json({ at: new Date().toISOString(), sites });
}
