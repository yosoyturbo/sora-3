# Ghost Sora 3 — evento global

## Arquivos
- `index.html`: site completo (HTML/CSS/JS + Firebase).
- `firestore.rules`: regras públicas temporárias para o modo sem login escolhido.

## Configuração
1. No Firebase Console, crie o Cloud Firestore Database.
2. Abra Firestore > Regras e publique o conteúdo de `firestore.rules`.
3. Hospede `index.html` no GitHub Pages ou outro host estático.
4. Abra o site, clique em **Abrir painel**, digite `Admin`.
5. Escolha a data/hora e confirme. A hora é convertida para timestamp Unix e todos os visitantes contam até o mesmo instante global.
6. Mensagens globais são publicadas pelo mesmo painel.

## Aviso de segurança
O código `Admin` é apenas uma trava visual local, não autentica o administrador. Como o projeto foi configurado sem Authentication/backend, as regras acima permitem que qualquer pessoa com acesso ao projeto altere o documento `event/live`. Qualquer visitante pode inspecionar o JavaScript e descobrir o código. Use somente durante o evento e depois apague o banco ou feche as regras.

## Observações
- Sore AI é um chatbot local de respostas predefinidas; não usa modelo de IA.
- As cenas são efeitos CSS/visuais leves, não renderização 3D realista.
- A contagem é global: uma data/hora local escolhida pelo admin vira um instante absoluto compartilhado.
- A fala em inglês dos últimos 10 segundos depende do navegador permitir áudio e de o visitante interagir previamente com a página.
