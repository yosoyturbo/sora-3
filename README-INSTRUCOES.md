# Sora 3 — integração Agnes AI v2.0

Este pacote preserva a interface original do Sora 3 e troca a integração antiga da FreeTheAI pela Agnes AI.

## Arquivos

- `index.html` — interface do site com integração Agnes.
- `config.js` — URL pública do Cloudflare Worker (não contém segredo).
- `worker/src/index.js` — proxy seguro para Agnes AI.
- `worker/wrangler.toml` — configuração do Worker.

## Publicar o site

No GitHub, mantenha a estrutura `public/` e configure GitHub Pages para publicar a branch `main` pela pasta `/ (root)`. O `index.html` já está na raiz.

## Configurar e publicar o Worker

1. No Cloudflare, abra o Worker `sora-3-api`.
2. Substitua o conteúdo do editor pelo arquivo `worker/src/index.js`.
3. Em Settings > Variables and Secrets, crie/confirmе o Secret `AGNES_API_KEY` com a chave atual da Agnes. Nunca envie a chave ao GitHub ou ao navegador.
4. Faça Deploy.
5. Abra `https://sora-3.migueltoproblox.workers.dev/health`. Deve responder com `{"ok":true,...}`.

O Worker permite chamadas do domínio `https://yosoyturbo.github.io`. A chave Agnes permanece apenas no Cloudflare.

## API utilizada

Modelo `agnes-video-v2.0`; criação em `POST /v1/videos`; consulta usando o `video_id` em `GET /agnesapi`. A API é assíncrona. O Worker converte duração e tamanho em `width`, `height`, `num_frames` (regra 8n+1) e `frame_rate: 24`.

## Importante

- Não coloque a chave Agnes em `config.js`, HTML, GitHub ou mensagens.
- Se a chave antiga foi exposta, mantenha-a revogada e use uma chave nova apenas como Secret no Cloudflare.
- CORS não substitui autenticação nem limite de uso. Para um site público em produção, adicione Firebase Auth/rate limiting antes de abrir geração irrestrita.
