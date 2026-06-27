const ALLOWED_PATHS = [
  '/x/series/archives',
];

const ALLOWED_ORIGINS = [
  'https://space.bilibili.com',
  'https://www.bilibili.com',
];

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

    const headers = new Headers();
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    headers.set('Referer', 'https://space.bilibili.com/');
    headers.set('Origin', 'https://space.bilibili.com');
    headers.set('Accept', 'application/json, text/plain, */*');
    headers.set('Accept-Language', 'zh-CN,zh;q=0.9');

    const clientReferer = request.headers.get('Referer');
    if (clientReferer) {
      headers.set('Referer', clientReferer);
    }

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      });

      const responseHeaders = new Headers(response.headers);
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Referer, User-Agent');
      responseHeaders.delete('content-security-policy');
      responseHeaders.delete('content-security-policy-report-only');

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
    'Access-Control-Allow-Headers': 'Content-Type, Referer, User-Agent',
    'Access-Control-Max-Age': '86400',
  };
}
