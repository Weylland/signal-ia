// Les balises og:image vivent dans le <head> : on ne lit que les premiers ~256 Ko
// du flux puis on coupe, au lieu de charger toute la page en mémoire (parfois des Mo).
async function readHead(res: Response, maxBytes = 256 * 1024): Promise<string> {
  if (!res.body) return res.text();
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let html = "";
  let read = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      read += value.length;
      html += decoder.decode(value, { stream: true });
      if (read >= maxBytes || html.includes("</head>")) break;
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return html;
}

export async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; watch-ia/1.0)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const html = await readHead(res);
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const image = match?.[1] ?? null;
    return image && image.startsWith("http") ? image : null;
  } catch {
    return null;
  }
}
