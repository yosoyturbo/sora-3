// Configuração pública do Sora 3.
// Nunca coloque chaves privadas da FreeTheAI ou segredos do Firebase neste arquivo.
window.SORA_CONFIG = {
  // Será preenchido com a URL do Cloudflare Worker quando publicarmos o proxy.
  workerUrl: "COLE_A_URL_DO_WORKER_AQUI",
  // O ID exato do modelo será configurado após conferirmos os modelos disponíveis.
  videoModel: "",
  videoModelPro: "",
  sizes: {
    "9:16-720p": "720x1280",
    "16:9-720p": "1280x720",
    "9:16-1080p": "1080x1920",
    "16:9-1080p": "1920x1080"
  },
  pollSeconds: 4,
  maxWaitMinutes: 20
};
