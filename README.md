# Frontend: Academia RGC Training

HTML, CSS e JavaScript puro (sem build, sem dependências).

## Estrutura
```
static/                  <- vai para src/main/resources/static/ do backend
├── index.html
├── css/styles.css
└── js/
    ├── config.js        <- ÚNICO arquivo que você edita (API, contato, horários)
    ├── schedule.js      <- cartões de horário + "aberto agora" (lê o config)
    ├── chat.js          <- chatbot: API, erros, retry, histórico, links, saúde
    └── ui.js            <- menu mobile, revelar ao rolar, botões "perguntar ao chat"
```
O `favicon.svg` já existe no backend (`src/main/resources/static/favicon.svg`) e o `index.html` aponta para ele.

## Como colocar no backend (api_academia_rgc_chatbot)
1. Substitua `src/main/resources/static/index.html` pelo `static/index.html` daqui.
2. Copie as pastas `css/` e `js/` para `src/main/resources/static/`. Mantenha o `favicon.svg`.
3. Suba a aplicação e abra `http://localhost:8080/`. Mesma origem: não precisa de CORS.
4. O deploy atual (push na `main` → Actions → imagem → rollout) já leva o front junto, porque o `Dockerfile` empacota `src/`.

## Front separado (Live Server)
Em `config.js`, `API_BASE_URL: 'http://localhost:8080'`, e o backend precisa de CORS para a origem do Live Server (modelo em `backend/WebConfig.java`, que cobre só `/api/**`). A checagem de saúde do chat só roda com `API_BASE_URL: ''`. Não abra o arquivo com duplo clique (`file://`).

## Contrato da API
`POST /api/chat` com `{ "sessionId": "web-...", "mensagem": "..." }` e resposta `{ "resposta": "...", "intentDetectado": "...|null", "score": 0.83, "fallback": false }`.
Ao abrir o chat, o front consulta `GET /actuator/health` (exposto pelo backend) e avisa o visitante se o atendimento automático estiver fora do ar.

## O que o chat faz
- Mostra erro claro (rede, timeout, 4xx, 5xx, resposta inválida) e oferece "Tentar novamente" sem duplicar a mensagem.
- Em `fallback` ou intenção `atendimento_humano`, mostra botões de WhatsApp e ligar (dados do `config.js`).
- Transforma telefone, e-mail e URL das respostas em links (sem `innerHTML`).
- Guarda a conversa na aba (`sessionStorage`) e tem botão de nova conversa (gera novo `sessionId`).
- Os botões "Quero este plano" abrem o chat já perguntando.

## Depuração
- `?debug=1` mostra intenção e score abaixo de cada resposta.
- `?mock=1` responde no navegador, sem backend.
- Teste direto: `curl -X POST localhost:8080/api/chat -H "Content-Type: application/json" -d '{"sessionId":"t","mensagem":"horario"}'`

## Atenção: conteúdo do site x banco
O site e o banco (`sql/banco.sql`) hoje se contradizem, e o chatbot responde com o texto do banco. Veja a tabela de divergências entregue junto com este pacote. Horários, contato e modalidades do site vêm de `config.js` e do `index.html`; as respostas do bot vêm de `bot_responses`. Mudou um, mude o outro.
