# Sora 3 — geração + login

## Conteúdo
- `index.html`: interface existente, seletor Sora 3 / Sora 3S Flash e bloqueio com cadastro/login Firebase.
- `config.js`: URL do Worker e configuração pública do Firebase (preencher antes de publicar).
- `worker/src/index.js`: proxy Agnes; chave fica somente no Cloudflare Secret `AGNES_API_KEY`.

## Firebase (necessário para login real)
1. Firebase Console > criar projeto > Authentication > Sign-in method > habilitar Email/Password.
2. Em Project settings > Your apps, registrar app Web e copiar apiKey, authDomain, projectId e appId para `config.js`.
3. Authentication > Settings > Authorized domains: adicionar `yosoyturbo.github.io`.
4. Publicar `index.html` e `config.js` na raiz do GitHub Pages.

## Cloudflare
1. Workers & Pages > `sora-3-api` > Edit code: substituir pelo `worker/src/index.js` deste ZIP e Deploy.
2. Settings > Variables and Secrets: manter/criar Secret `AGNES_API_KEY` com sua chave Agnes (não coloque em arquivos públicos).
3. Teste `/health`.

## Modelos
- Sora 3 usa `agnes-video-v2.0` (legado; pode estar descontinuado/indisponível no catálogo da Agnes).
- Sora 3S Flash usa `agnes-video-2.5-flash` (720P; API moderna).
O modelo 2.0 pode falhar se a Agnes não o disponibilizar mais. O seletor não garante disponibilidade do provedor.

## Segurança
Nunca publique a chave Agnes no GitHub, config.js, HTML ou chat. Se uma chave foi compartilhada, revogue e gere outra. Firebase config é pública por design; proteja dados com Firebase Security Rules.
