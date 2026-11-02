// Configuração pública do Sora 3.
// IMPORTANTE: nunca coloque a chave da Agnes aqui. Ela fica como Secret no Cloudflare.
window.SORA_CONFIG = {
  workerUrl: "https://sora-3.migueltoproblox.workers.dev",
  pollSeconds: 8,
  maxWaitMinutes: 20,
  sizes: {
    "9:16-720p": "720x1280",
    "16:9-720p": "1280x720",
    "9:16-1080p": "1080x1920",
    "16:9-1080p": "1920x1080"
  }
};
