/**
 * Proxy inicial da FreeTheAI para Cloudflare Workers.
 * A chave privada fica em FREETHEAI_API_KEY (secret do Worker), nunca no navegador.
 * Rotas suportadas: /v1/models, /v1/videos, /v1/videos/:id e /v1/videos/:id/content
 * Antes de produção, adicionar validação de Firebase Auth e limites por usuário.
 */
const UPSTREAM = "https://api.freetheai.org";
const ALLOWED = new Set(["GET", "POST"]);

function cors(origin) {
  // Em produção, substituir * pelo domínio exato do site publicado.
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "*";
    const headers = cors(origin);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (!ALLOWED.has(request.method)) return new Response("Method not allowed", { status: 405, headers });
    if (!env.FREETHEAI_API_KEY) return Response.json({ error: "Worker secret FREETHEAI_API_KEY não configurado" }, { status: 500, headers });

    const incoming = new URL(request.url);
    const path = incoming.pathname;
    if (!/^\/v1\/(models|videos(?:\/[A-Za-z0-9_-]+(?:\/content)?)?)$/.test(path)) {
      return new Response("Not found", { status: 404, headers });
    }

    const upstreamHeaders = new Headers({ Authorization: `Bearer ${env.FREETHEAI_API_KEY}` });
    const contentType = request.headers.get("Content-Type");
    if (contentType) upstreamHeaders.set("Content-Type", contentType);
    const init = { method: request.method, headers: upstreamHeaders };
    if (request.method === "POST") init.body = await request.arrayBuffer();

    try {
      const upstream = await fetch(UPSTREAM + path + incoming.search, init);
      const responseHeaders = new Headers(headers);
      const type = upstream.headers.get("Content-Type");
      if (type) responseHeaders.set("Content-Type", type);
      responseHeaders.set("Cache-Control", "no-store");
      return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
    } catch {
      return Response.json({ error: "Falha ao conectar ao provedor de vídeo" }, { status: 502, headers });
    }
  }
};
