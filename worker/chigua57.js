// chigua57-proxy: Cloudflare Worker — 代理 chigua.media 图片，透传 Referer: https://57cg4.com/
// 部署：wrangler deploy worker/chigua57.js --name chigua57-proxy
// 用法：https://chigua57-proxy.workers.dev/?url=<图片URL>
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const target = url.searchParams.get('url');
    if (!target) {
      return new Response('Missing url parameter', { status: 400 });
    }
    let upstream;
    try {
      upstream = new URL(target);
    } catch {
      return new Response('Invalid url parameter', { status: 400 });
    }
    // 仅允许 chigua.media 域名
    if (!/^(www\.)?chigua\.media$/.test(upstream.hostname)) {
      return new Response('Domain not allowed', { status: 403 });
    }
    const resp = await fetch(target, {
      headers: {
        'Referer': 'https://57cg4.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/*,*/*',
      },
    });
    if (!resp.ok) {
      return new Response('Upstream error', { status: resp.status });
    }
    const ct = resp.headers.get('content-type') || 'application/octet-stream';
    const buf = await resp.arrayBuffer();
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};