# Frontend: Academia RGC Training

HTML, CSS e JavaScript puro (sem build, sem dependências).

## Estrutura
```
static/                  <- copiar para src/main/resources/static/
├── index.html
├── css/styles.css
└── js/
    ├── config.js        <- ÚNICO arquivo que você edita para conectar
    ├── schedule.js      <- status aberto/fechado + horário do dia
    └── chat.js          <- chatbot (chamada à API, erros, modo demo)
backend/WebConfig.java   <- CORS (só se o front rodar fora do Spring)
```

## Compatibilidade com o backend (api_academia_rgc_chatbot)
Conferido contra `ChatController`, `ChatRequest` e `ChatResponse`: o contrato do `POST /api/chat` bate com o `chat.js`. O backend não tem CORS nem Spring Security, e `src/main/resources/static` não existe ainda, então a opção A abaixo funciona sem mudar código Java.

## Como rodar
**A) Pelo Spring Boot (recomendado):** crie `src/main/resources/static/` no projeto da API, copie o conteúdo de `static/` para `src/main/resources/static/`, suba a aplicação e abra `http://localhost:8080/`. Não precisa de CORS.

**B) Front separado (VS Code Live Server, porta 5500):**
1. Em `config.js`, defina `API_BASE_URL: 'http://localhost:8080'`.
2. Copie `backend/WebConfig.java` para `com.rgctraining.chatbot.config` e ajuste as origens se necessário.
3. Não abra o `index.html` com duplo clique (`file://`): o navegador bloqueia a chamada. Use o Live Server.

**C) Sem backend (demonstração):** abra `index.html?mock=1`. Responde no navegador com palavras-chave.

## Contrato da API
`POST /api/chat`
```json
{ "sessionId": "web-...", "mensagem": "qual o horario" }
```
```json
{ "resposta": "...", "intentDetectado": "horario_funcionamento", "score": 0.83, "fallback": false }
```
Atrás da VPN: o backend e o Postgres precisam estar acessíveis (ZeroTier ativo) para o chat responder.

## Depuração
- `index.html?debug=1` mostra intenção e score abaixo de cada resposta (útil para calibrar o limiar).
- Erros de rede aparecem no console (`[chat] falha ao chamar ...`).
- Teste o backend direto: `curl -X POST localhost:8080/api/chat -H "Content-Type: application/json" -d '{"sessionId":"t","mensagem":"horario"}'`

## Deploy
O `Dockerfile` do backend empacota `src/` no jar, então o frontend em `static/` vai junto no deploy atual (push na `main` → GitHub Actions → imagem → `kubectl rollout`). Não precisa de servidor separado.

## Atenção: endpoints abertos
`/api/chat/feedback` e `/api/chat/recarregar-modelo` não têm autenticação. O frontend não os usa, mas, com o site público, qualquer visitante poderia chamá-los e inserir frases erradas no treino. Vale protegê-los antes de publicar.

## Manter sincronizado com o banco
Horários, preços e aulas do site são texto fixo no HTML. Os horários já seguem o `sql/banco.sql`. A lista de modalidades do site (Bike, FitDance, Kids, Boxe, Muay Thai, Yoga) ainda difere da resposta `aulas_modalidades` do banco (musculação, spinning, funcional, yoga, jiu-jitsu). Se mudar em `bot_responses`, mude aqui também, e vice-versa. Horários também estão em `schedule.js` (objeto `SCHEDULE`).
