// Submit every sitemap URL to IndexNow (Bing, Yandex, Seznam, Naver...).
// Bing's index also feeds DuckDuckGo, Ecosia, Yahoo, ChatGPT search and Copilot.
// Usage: node scripts/indexnow.mjs [https://latexci.com]
const KEY = "2b6fc98f3be93ccf36304e752225272a"; // public by design: served at /2b6fc98f3be93ccf36304e752225272a.txt
const origin = process.argv[2] ?? "https://latexci.com";
const host = new URL(origin).host;

const xml = await (await fetch(`${origin}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => new URL(u).host === host);
if (!urls.length) throw new Error("no URL found in the sitemap");

for (let i = 0; i < urls.length; i += 10000) {
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: KEY, keyLocation: `${origin}/${KEY}.txt`, urlList: urls.slice(i, i + 10000) }),
  });
  console.log(`IndexNow: ${urls.slice(i, i + 10000).length} URLs -> HTTP ${res.status}`);
  if (res.status >= 300) console.log(await res.text());
}
