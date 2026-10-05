/* Horários por dia da semana (0 = domingo). null = fechado o dia todo.
   Manter igual à resposta da intenção horario_funcionamento (sql/banco.sql). */
const SCHEDULE = {0:null, 1:[6,22], 2:[6,22], 3:[6,22], 4:[6,22], 5:[6,22], 6:[8,14]};
const DIAS = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
const fmt = h => { const m = Math.round((h % 1) * 60); return String(Math.floor(h)).padStart(2,'0') + 'h' + (m ? String(m).padStart(2,'0') : ''); };
(function status(){
  const now = new Date(), d = now.getDay(), h = now.getHours() + now.getMinutes()/60;
  const today = SCHEDULE[d];
  const open = !!today && h >= today[0] && h < today[1];
  document.getElementById('today').classList.toggle('open', open);
  document.getElementById('st').textContent = open ? 'Aberto agora' : 'Fechado agora';
  let msg = '';
  if (open) msg = 'Hoje até ' + fmt(today[1]) + '.';
  else if (today && h < today[0]) msg = 'Abrimos hoje às ' + fmt(today[0]) + '.';
  else {
    for (let i = 1; i <= 7; i++) {
      const k = (d + i) % 7, n = SCHEDULE[k];
      if (n) { msg = 'Abrimos ' + (i === 1 ? 'amanhã' : DIAS[k]) + ' às ' + fmt(n[0]) + '.'; break; }
    }
  }
  document.getElementById('st2').textContent = msg;
  document.querySelectorAll('#hours div').forEach(el => {
    if (el.dataset.d.split(',').includes(String(d))) el.classList.add('now');
  });
})();
