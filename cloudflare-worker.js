const ALLOWED_PATHS = [
  '/x/series/archives',
];

function generateBuvid3() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result + 'infoc';
}

function generateBuvid4(buvid3) {
  const hash = function(str) {
    let h1 = 0xdeadbeef ^ 0;
    let h2 = 0x41c6ce57 ^ 0;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  };
  return hash(buvid3).toUpperCase();
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return handleCors(request);
    }

    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '') {
      return new Response('Bilibili API Proxy Worker is running.', {
        status: 200,
        headers: corsHeaders(),
      });
    }

    const targetPath = url.pathname;
    const pathAllowed = ALLOWED_PATHS.some(p => targetPath.startsWith(p));
    if (!pathAllowed) {
      return new Response(JSON.stringify({ error: 'Path not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    const targetUrl = `https://api.bilibili.com${targetPath}${url.search}`;

    const buvid3 = env.BILIBILI_BUVID3 || generateBuvid3();
    const buvid4 = env.BILIBILI_BUVID4 || generateBuvid4(buvid3);
    const customCookies = env.BILIBILI_COOKIES || '';

    const cookieParts = [];
    cookieParts.push(`buvid3=${buvid3}`);
    cookieParts.push(`buvid4=${buvid4}`);
    if (customCookies) {
      cookieParts.push(customCookies);
    }
    const cookieString = cookieParts.join('; ');

    const headers = new Headers();
    headers.set('Cookie', cookieString);
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');
    headers.set('Referer', 'https://space.bilibili.com/');
    headers.set('Origin', 'https://space.bilibili.com');
    headers.set('Accept', 'application/json, text/plain, */*');
    headers.set('Accept-Language', 'zh-CN,zh;q=0.9,en;q=0.8');
    headers.set('Accept-Encoding', 'gzip, deflate, br');
    headers.set('Connection', 'keep-alive');
    headers.set('Sec-Ch-Ua', '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"');
    headers.set('Sec-Ch-Ua-Mobile', '?0');
    headers.set('Sec-Ch-Ua-Platform', '"Windows"');
    headers.set('Sec-Fetch-Dest', 'empty');
    headers.set('Sec-Fetch-Mode', 'cors');
    headers.set('Sec-Fetch-Site', 'same-site');
    headers.set('Dnt', '1');
    headers.set('Te', 'trailers');

    const clientReferer = request.headers.get('Referer');
    if (clientReferer) {
      headers.set('Referer', clientReferer);
    }

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
        cf: {
          cacheTtl: 60,
          cacheEverything: false,
        },
      });

      const responseHeaders = new Headers(response.headers);
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Referer, User-Agent, Cookie');
      responseHeaders.delete('content-security-policy');
      responseHeaders.delete('content-security-policy-report-only');
      responseHeaders.delete('set-cookie');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Proxy request failed', message: error.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }
  },
};

function handleCors(request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Referer, User-Agent, Cookie',
    'Access-Control-Max-Age': '86400',
  };
}
