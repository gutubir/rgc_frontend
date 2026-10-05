/* Chatbot RGC: contrato com o backend
   POST {API_BASE_URL}/api/chat
   Request : { "sessionId": string, "mensagem": string }
   Response: { "resposta": string, "intentDetectado": string|null, "score": number, "fallback": boolean } */
(function () {
  'use strict';

  const cfg = Object.assign({ API_BASE_URL: '', CHAT_ENDPOINT: '/api/chat', USE_MOCK: false,
                              DEBUG: false, TIMEOUT_MS: 15000, MAX_LENGTH: 300 }, window.RGC_CONFIG || {});
  const qs = new URLSearchParams(location.search);
  if (qs.has('mock'))  cfg.USE_MOCK = qs.get('mock')  !== '0';
  if (qs.has('debug')) cfg.DEBUG    = qs.get('debug') !== '0';
  const CHAT_URL = cfg.API_BASE_URL.replace(/\/$/, '') + cfg.CHAT_ENDPOINT;

  const $ = id => document.getElementById(id);
  const chat = $('chat'), msgs = $('msgs'), input = $('in'), send = $('send'), fab = $('fab');
  input.maxLength = cfg.MAX_LENGTH;

  /* ---------- Sessão ---------- */
  function newId() {
    return 'web-' + (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 12));
  }
  function getSessionId() {
    try {
      let id = sessionStorage.getItem('rgc.sessionId');
      if (!id) { id = newId(); sessionStorage.setItem('rgc.sessionId', id); }
      return id;
    } catch (e) { return newId(); }
  }
  const sessionId = getSessionId();

  /* ---------- Chamada à API ---------- */
  class ApiError extends Error {
    constructor(kind, status) { super(kind); this.kind = kind; this.status = status; }
  }

  async function callApi(text) {
    if (cfg.USE_MOCK) return mockReply(text);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), cfg.TIMEOUT_MS);
    try {
      const res = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ sessionId, mensagem: text }),
        signal: ctrl.signal
      });
      if (!res.ok) throw new ApiError('http', res.status);
      const data = await res.json();
      if (!data || typeof data.resposta !== 'string') throw new ApiError('invalid');
      return data;
    } catch (e) {
      if (e instanceof ApiError) throw e;
      if (e.name === 'AbortError') throw new ApiError('timeout');
      throw new ApiError('network');
    } finally {
      clearTimeout(timer);
    }
  }

  function errorText(e) {
    const tel = ' Se preferir, ligue para (48) 3000-0000.';
    if (e.kind === 'timeout') return 'O servidor demorou para responder. Tente novamente.' + tel;
    if (e.kind === 'http' && e.status >= 400 && e.status < 500) return 'Não consegui processar essa mensagem. Tente reescrever.';
    if (e.kind === 'http') return 'O atendimento automático está com problemas no momento.' + tel;
    if (e.kind === 'invalid') return 'Recebi uma resposta inesperada do servidor.' + tel;
    return 'Não consegui me conectar ao servidor.' + tel;
  }

  /* ---------- Modo demonstração (sem backend) ---------- */
  const MOCK = [
    { intent: 'horario_funcionamento', kw: ['horario', 'funcionamento', 'abre', 'fecha', 'aberto', 'horas'],
      resp: 'Funcionamos de segunda a sexta das 6h às 22h e aos sábados das 8h às 14h. Fechamos aos domingos e feriados.' },
    { intent: 'planos_matricula', kw: ['plano', 'planos', 'mensalidade', 'preco', 'valor', 'matricula', 'custa'],
      resp: 'Temos o plano Mensal (R$ 129), Trimestral (R$ 109/mês) e Anual (R$ 89/mês). Todos incluem musculação e aulas coletivas.' },
    { intent: 'personal_trainer', kw: ['personal', 'trainer', 'acompanhamento', 'instrutor'],
      resp: 'Sim, temos personal trainers credenciados. O valor é combinado direto com o profissional.' },
    { intent: 'cancelamento_trancamento', kw: ['cancelar', 'cancelamento', 'trancar', 'trancamento', 'desistir'],
      resp: 'Para cancelar ou trancar, compareça à recepção com documento. O trancamento tem prazo mínimo de 30 dias.' },
    { intent: 'aulas_modalidades', kw: ['aula', 'aulas', 'modalidade', 'bike', 'fitdance', 'kids', 'boxe', 'muay', 'yoga'],
      resp: 'Oferecemos RGC Bike, FitDance, RGC Kids, Boxe, Muay Thai e Yoga. Veja objetivos e durações na seção Aulas e modalidades.' }
  ];
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ');

  async function mockReply(text) {
    await new Promise(r => setTimeout(r, 500));
    const words = norm(text).split(/\s+/);
    let best = null, hits = 0;
    MOCK.forEach(m => {
      const n = m.kw.filter(k => words.includes(k)).length;
      if (n > hits) { hits = n; best = m; }
    });
    if (!best) return { resposta: 'Não encontrei essa informação. Vou encaminhar você para um atendente humano.',
                        intentDetectado: null, score: 0, fallback: true };
    return { resposta: best.resp, intentDetectado: best.intent, score: Math.min(0.95, 0.4 + 0.25 * hits), fallback: false };
  }

  /* ---------- Interface ---------- */
  function add(text, who, extra) {
    const el = document.createElement('div');
    el.className = 'm ' + who + (extra ? ' ' + extra : '');
    el.textContent = text;                       // textContent: evita injeção de HTML
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  function addMeta(el, data) {
    const meta = document.createElement('span');
    meta.className = 'meta';
    const score = typeof data.score === 'number' ? data.score.toFixed(2) : '-';
    meta.textContent = 'intent: ' + (data.intentDetectado || 'nenhum') + ' | score: ' + score + (data.fallback ? ' | fallback' : '');
    el.appendChild(meta);
  }

  let started = false, busy = false;

  function toggle(show) {
    chat.classList.toggle('show', show);
    fab.setAttribute('aria-expanded', show);
    if (!show) return;
    input.focus();
    if (started) return;
    started = true;
    if (cfg.USE_MOCK) {
      const small = chat.querySelector('.ch-head small');
      small.textContent = '';
      const b = document.createElement('span'); b.className = 'mock-badge'; b.textContent = 'Modo demonstração';
      small.appendChild(b);
    }
    add('Olá! Sou o assistente da RGC Training. Posso ajudar com horários, planos, personal trainer, aulas e cancelamento.', 'bot');
    const chips = document.createElement('div'); chips.className = 'chips';
    ['Qual o horário de funcionamento?', 'Quais são os planos?', 'Tem personal trainer?', 'Quais aulas vocês têm?'].forEach(t => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = t;
      b.onclick = () => ask(t);
      chips.appendChild(b);
    });
    msgs.appendChild(chips);
  }

  async function ask(text) {
    if (busy) return;
    busy = true;
    document.querySelectorAll('.chips').forEach(c => c.remove());
    add(text, 'me');
    send.disabled = true;
    const wait = add('Digitando…', 'bot', 'typing');
    try {
      const data = await callApi(text);
      wait.remove();
      const el = add(data.resposta, 'bot', data.fallback ? 'fb' : '');
      if (cfg.DEBUG) addMeta(el, data);
    } catch (e) {
      wait.remove();
      add(errorText(e), 'bot', 'err');
      console.error('[chat] falha ao chamar', CHAT_URL, e);
    } finally {
      busy = false;
      send.disabled = false;
      input.focus();
    }
  }

  fab.onclick = () => toggle(!chat.classList.contains('show'));
  $('close').onclick = () => { toggle(false); fab.focus(); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && chat.classList.contains('show')) toggle(false); });
  $('form').addEventListener('submit', e => {
    e.preventDefault();
    const t = input.value.trim();
    if (!t) return;
    input.value = '';
    ask(t);
  });
})();
