
const AGNES_API = "https://apihub.agnes-ai.com";

const ALLOWED_ORIGINS = new Set([
  "https://yosoyturbo.github.io"
]);

const MODEL = "agnes-video-v2.0";
const FRAME_RATE = 24;

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin)
      ? origin
      : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function jsonError(message, status, headers) {
  return Response.json(
    { error: message },
    { status, headers }
  );
}

function getVideoSettings(data) {
  const match = String(data.size || "1280x720")
    .match(/^(\d{2,4})x(\d{2,4})$/);

  if (!match) {
    throw new Error("Resolução inválida.");
  }

  const width = Number(match[1]);
  const height = Number(match[2]);

  if (
    width < 256 || width > 1920 ||
    height < 256 || height > 1920
  ) {
    throw new Error("Resolução fora dos limites permitidos.");
  }

  const seconds = Number(data.seconds || 5);

  if (!Number.isFinite(seconds) || seconds < 1 || seconds > 18) {
    throw new Error("Duração inválida. Use entre 1 e 18 segundos.");
  }

  const requestedFrames = Math.round(seconds * FRAME_RATE);

  // A Agnes utiliza num_frames no formato 8n + 1.
  const numFrames = Math.min(
    441,
    Math.max(
      9,
      Math.round((requestedFrames - 1) / 8) * 8 + 1
    )
  );

  return {
    width,
    height,
    num_frames: numFrames,
    frame_rate: FRAME_RATE
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers
      });
    }

    if (!ALLOWED_ORIGINS.has(origin)) {
      return jsonError("Origem não autorizada.", 403, headers);
    }

    // A chave é obtida do Secret configurado no Cloudflare.
    const apiKey = env.AGNES_API_KEY;

    if (!apiKey) {
      return jsonError(
        "A chave AGNES_API_KEY não está configurada no Cloudflare.",
        500,
        headers
      );
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
        return jsonError("JSON inválido.", 400, headers);
      }

      if (
        !data ||
        typeof data.prompt !== "string" ||
        !data.prompt.trim()
      ) {
        return jsonError("Digite uma descrição para o vídeo.", 400, headers);
      }

      if (data.prompt.length > 2000) {
        return jsonError("A descrição é muito longa.", 400, headers);
      }

      let settings;

      try {
        settings = getVideoSettings(data);
      } catch (err) {
        return jsonError(err.message, 400, headers);
      }

      body = JSON.stringify({
        model: MODEL,
        prompt: data.prompt.trim(),
        ...settings
      });

      target = `${AGNES_API}/v1/videos`;

    } else if (path === "/agnesapi" && request.method === "GET") {
      const videoId = incoming.searchParams.get("video_id");

      if (
        !videoId ||
        !/^[A-Za-z0-9_-]+$/.test(videoId)
      ) {
        return jsonError("ID do vídeo inválido.", 400, headers);
      }

      target =
        `${AGNES_API}/agnesapi?video_id=${encodeURIComponent(videoId)}` +
        `&model_name=${encodeURIComponent(MODEL)}`;

    } else {
      return jsonError("Rota não encontrada.", 404, headers);
    }

    try {
      const upstream = await fetch(target, {
        method: request.method,
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          ...(body ? { "Content-Type": "application/json" } : {})
        },
        ...(body ? { body } : {})
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

    } catch (err) {
      return jsonError(
        "Não foi possível conectar à Agnes AI. Tente novamente.",
        502,
        headers
      );
    }
  }
};
