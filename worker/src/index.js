
const AGNES_API = "https://apihub.agnes-ai.com";

// Cole sua chave nova aqui.
// Este arquivo deve ficar somente no repositório privado.
const AGNES_API_KEY = "COLE_SUA_CHAVE_AGNES_AQUI";

const ALLOWED_ORIGINS = new Set([
  "https://yosoyturbo.github.io"
]);

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function error(message, status, headers) {
  return Response.json({ error: message }, { status, headers });
}

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (!ALLOWED_ORIGINS.has(origin)) {
      return error("Origem não autorizada", 403, headers);
    }

    if (
      !AGNES_API_KEY ||
      AGNES_API_KEY === "COLE_SUA_CHAVE_AGNES_AQUI"
    ) {
      return error("Configure a chave da Agnes no Worker", 500, headers);
    }

    const incoming = new URL(request.url);
    const path = incoming.pathname;

    let target;
    let body;

    if (path === "/v1/videos" && request.method === "POST") {
      let data;

      try {
        data = await request.json();
      } catch {
        return error("JSON inválido", 400, headers);
      }

      const dimensions = String(data.size || "1280x720").match(/^(\d+)x(\d+)$/);
      const width = dimensions ? Number(dimensions[1]) : 1280;
      const height = dimensions ? Number(dimensions[2]) : 720;

      const seconds = Math.max(1, Math.min(Number(data.seconds) || 5, 18));
      const frameRate = 24;
      const requestedFrames = Math.round(seconds * frameRate);
      const numFrames = Math.min(
        441,
        Math.max(9, Math.round((requestedFrames - 1) / 8) * 8 + 1)
      );

      body = JSON.stringify({
        model: "agnes-video-v2.0",
        prompt: data.prompt,
        width,
        height,
        num_frames: numFrames,
        frame_rate: frameRate
      });

      if (!data.prompt || typeof data.prompt !== "string") {
        return error("Prompt inválido", 400, headers);
      }

      target = `${AGNES_API}/v1/videos`;
    } else if (path === "/agnesapi" && request.method === "GET") {
      const videoId = incoming.searchParams.get("video_id");

      if (!videoId || !/^[A-Za-z0-9_-]+$/.test(videoId)) {
        return error("video_id inválido", 400, headers);
      }

      target =
        `${AGNES_API}/agnesapi?video_id=${encodeURIComponent(videoId)}` +
        `&model_name=agnes-video-v2.0`;
    } else {
      return error("Rota não encontrada", 404, headers);
    }

    try {
      const upstream = await fetch(target, {
        method: request.method,
        headers: {
          Authorization: `Bearer ${AGNES_API_KEY}`,
          ...(body ? { "Content-Type": "application/json" } : {})
        },
        body
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
      return error("Falha ao conectar à Agnes AI", 502, headers);
    }
  }
};
