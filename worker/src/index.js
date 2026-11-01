
const AGNES_API = "https://apihub.agnes-ai.com";

const ALLOWED_ORIGINS = new Set([
  "https://yosoyturbo.github.io"
]);

function cors(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin);

  return {
    "Access-Control-Allow-Origin": allowed ? origin : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function jsonError(message, status, headers) {
  return Response.json({ error: message }, { status, headers });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (!ALLOWED_ORIGINS.has(origin)) {
      return jsonError("Origem não autorizada", 403, headers);
    }

    if (!env.AGNES_API_KEY) {
      return jsonError("Segredo AGNES_API_KEY não configurado", 500, headers);
    }

    const incoming = new URL(request.url);
    const path = incoming.pathname;

    let target;

    if (path === "/v1/videos" && request.method === "POST") {
      target = `${AGNES_API}/v1/videos`;
    } else if (path === "/agnesapi" && request.method === "GET") {
      const videoId = incoming.searchParams.get("video_id");

      if (!videoId || !/^[A-Za-z0-9_-]+$/.test(videoId)) {
        return jsonError("video_id inválido", 400, headers);
      }

      target = `${AGNES_API}/agnesapi?video_id=${encodeURIComponent(videoId)}`;
    } else if (path === "/v1/models" && request.method === "GET") {
      target = `${AGNES_API}/v1/models`;
    } else {
      return jsonError("Rota não encontrada", 404, headers);
    }

    const upstreamHeaders = new Headers({
      Authorization: `Bearer ${env.AGNES_API_KEY}`
    });

    if (request.method === "POST") {
      upstreamHeaders.set("Content-Type", "application/json");
    }

    try {
      const upstream = await fetch(target, {
        method: request.method,
        headers: upstreamHeaders,
        body: request.method === "POST"
          ? await request.arrayBuffer()
          : undefined
      });

      const responseHeaders = new Headers(headers);
      responseHeaders.set("Cache-Control", "no-store");

      const contentType = upstream.headers.get("Content-Type");
      if (contentType) {
        responseHeaders.set("Content-Type", contentType);
      }

      return new Response(upstream.body, {
        status: upstream.status,
        headers: responseHeaders
      });
    } catch {
      return jsonError("Erro ao conectar à Agnes AI", 502, headers);
    }
  }
};
