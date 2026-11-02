/**
 * Sora 3 -> Agnes AI (modelo agnes-video-v2.0)
 * Cloudflare Worker Secret obrigatório: AGNES_API_KEY
 *
 * Rotas:
 *   POST /v1/videos                  cria tarefa
 *   GET  /agnesapi?video_id=...      consulta tarefa
 *   GET  /health                     verifica se o Worker está ativo
 */
const AGNES_API = "https://apihub.agnes-ai.com";
const MODEL = "agnes-video-v2.0";
const ALLOWED_ORIGINS = new Set([
  "https://yosoyturbo.github.io"
]);

function corsHeaders(origin) {
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "null";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

function dimensions(size) {
  const allowed = {
    "720x1280": [720, 1280],
    "1280x720": [1280, 720],
    "1080x1920": [1080, 1920],
    "1920x1080": [1920, 1080]
  };
  return allowed[size] || allowed["720x1280"];
}

function framesFor(seconds) {
  // Agnes v2.0 exige num_frames <= 441 e no formato 8n + 1.
  const wanted = Math.round(seconds * 24);
  return Math.min(441, Math.max(9, Math.round((wanted - 1) / 8) * 8 + 1));
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      if (origin && !ALLOWED_ORIGINS.has(origin)) return new Response("Origin not allowed", { status: 403 });
      return new Response(null, { status: 204, headers });
    }

    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return json({ error: "Origin não autorizado." }, 403, headers);
    }

    if (new URL(request.url).pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "sora-3-agnes", model: MODEL }, 200, headers);
    }

    if (!env.AGNES_API_KEY) {
      return json({ error: "Secret AGNES_API_KEY não configurado no Cloudflare Worker." }, 500, headers);
    }

    const incoming = new URL(request.url);
    let upstreamUrl;
    let init;

    if (request.method === "POST" && incoming.pathname === "/v1/videos") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "O corpo da solicitação precisa ser JSON válido." }, 400, headers);
      }

      const prompt = String(body.prompt || "").trim();
      if (!prompt || prompt.length > 4000) {
        return json({ error: "Prompt obrigatório (máximo de 4.000 caracteres)." }, 400, headers);
      }

      const seconds = Math.max(1, Math.min(18, Number(body.seconds) || 5));
      const [width, height] = dimensions(String(body.size || "720x1280"));
      const payload = {
        model: MODEL,
        prompt,
        width,
        height,
        num_frames: framesFor(seconds),
        frame_rate: 24
      };

      upstreamUrl = AGNES_API + "/v1/videos";
      init = {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.AGNES_API_KEY}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      };
    } else if (request.method === "GET" && incoming.pathname === "/agnesapi") {
      const videoId = incoming.searchParams.get("video_id");
      if (!videoId) return json({ error: "Parâmetro video_id obrigatório." }, 400, headers);

      upstreamUrl = AGNES_API + "/agnesapi?video_id=" + encodeURIComponent(videoId)
        + "&model_name=" + encodeURIComponent(MODEL);
      init = {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${env.AGNES_API_KEY}`,
          "Accept": "application/json"
        }
      };
    } else {
      return json({ error: "Rota não encontrada." }, 404, headers);
    }

    try {
      const upstream = await fetch(upstreamUrl, init);
      const text = await upstream.text();
      let data;
      try { data = JSON.parse(text); }
      catch { data = { error: text || "Resposta inválida do provedor." }; }
      return json(data, upstream.status, headers);
    } catch (_) {
      return json({ error: "Não foi possível conectar à Agnes AI. Tente novamente." }, 502, headers);
    }
  }
};
