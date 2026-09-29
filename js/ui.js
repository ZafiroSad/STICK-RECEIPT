/* Piezas de interfaz comunes: iconos, Pantalla (shell de todo formulario), toast, dock y tema. */

const I = (d, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;

export const ICONOS = {
  recargar: I('<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>'),
  volver: I('<path d="M15 18l-6-6 6-6"/>'),
  mas: I('<path d="M12 5v14M5 12h14"/>'),
  menos: I('<path d="M5 12h14"/>'),
  nuevo: I('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 12v6M9 15h6"/>'),
  historial: I('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 8v4l3 2"/>'),
  clientes: I('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'),
  cobro: I('<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5v.01M17.5 14.5v.01"/>'),
  cotizacion: I('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'),
  recibo: I('<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/>'),
  orden: I('<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>'),
  entrega: I('<path d="M21 8l-9-5-9 5 9 5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>'),
  pdf: I('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 18v-6M9.5 15.5L12 18l2.5-2.5"/>'),
  ojo: I('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'),
  copiar: I('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
  editar: I('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  basura: I('<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>'),
  compartir: I('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>'),
  sol: I('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  luna: I('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
  usuario: I('<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>'),
  marca: I('<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.4 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>'),
  tarjeta: I('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>'),
  lista: I('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
  ajustes: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  numero: I('<path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/>'),
  respaldo: I('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>'),
  subir: I('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/>'),
  cheque: I('<path d="M20 6L9 17l-5-5"/>'),
  sliders: I('<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>'),
};

/* ── Tema ── */
export const aplicarTema = (tema) => {
  document.documentElement.classList.toggle('light', tema === 'claro');
  try { localStorage.setItem('stick:tema', tema === 'claro' ? 'claro' : 'oscuro'); } catch (e) { /* sin almacenamiento */ }
  const meta = document.querySelector('meta[name=theme-color]');
  if (meta) meta.content = tema === 'claro' ? '#f1f2f5' : '#15161b';
};
export const temaActual = () => (document.documentElement.classList.contains('light') ? 'claro' : 'oscuro');

/* ── Toast ── */
let toastEl = null;
let toastT = 0;
export const aviso = (texto, error = false) => {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    document.body.appendChild(toastEl);
  }
  toastEl.className = 'toast' + (error ? ' error' : '');
  toastEl.innerHTML = `<span class="tdot"></span><span></span>`;
  toastEl.lastChild.textContent = texto;
  // Reflow forzado en vez de requestAnimationFrame: si la pestaña no pinta, rAF se pospone y el
  // temporizador de salida podía correr antes que la entrada, dejando el aviso pegado en pantalla.
  void toastEl.offsetWidth;
  toastEl.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove('show'), 2600);
};

/* ── Pantalla ──
   Todo formulario de crear o editar es una pantalla completa, montada en <body> como hermana
   del .lienzo (nunca hija), con bloqueo de scroll del fondo y Escape para cerrar. */
const pila = [];
const actualizarBloqueo = () => {
  document.body.classList.toggle('bloqueado', pila.length > 0);
  document.body.classList.toggle('pantalla-abierta', pila.length > 0);
};

export const abrirPantalla = ({titulo, ancha = false, contenido, alCerrar}) => {
  const el = document.createElement('div');
  el.className = 'pantalla';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', titulo);
  el.innerHTML = `
    <div class="pantalla-in${ancha ? ' ancha' : ''}">
      <div class="pantalla-cab">
        <button class="icon-btn btn-volver" data-volver aria-label="Volver" title="Volver">${ICONOS.volver}</button>
        <h1 class="trunca"></h1>
      </div>
      <div data-cuerpo></div>
    </div>`;
  el.querySelector('h1').textContent = titulo;
  const cuerpo = el.querySelector('[data-cuerpo]');
  if (typeof contenido === 'string') cuerpo.innerHTML = contenido;
  else if (contenido) cuerpo.appendChild(contenido);
  document.body.appendChild(el);
  pila.push(el);
  actualizarBloqueo();

  let cerrada = false;
  const cerrar = (silencioso = false) => {
    if (cerrada) return;
    cerrada = true;
    document.removeEventListener('keydown', tecla);
    el.classList.add('saliendo');
    const fin = () => {
      el.remove();
      const i = pila.indexOf(el);
      if (i >= 0) pila.splice(i, 1);
      actualizarBloqueo();
      if (!silencioso && alCerrar) alCerrar();
    };
    const t = setTimeout(fin, 320);
    el.addEventListener('animationend', () => { clearTimeout(t); fin(); }, {once: true});
  };
  const tecla = (e) => {
    if (e.key === 'Escape' && pila[pila.length - 1] === el) cerrar();
  };
  document.addEventListener('keydown', tecla);
  el.querySelector('[data-volver]').addEventListener('click', () => cerrar());
  return {el, cuerpo, cerrar, titulo: (t) => { el.querySelector('h1').textContent = t; }};
};

export const cerrarTodas = () => {
  [...pila].reverse().forEach((el) => el.querySelector('[data-volver]')?.click());
};

/* ── Dock: una sola píldora que viaja ── */
export const montarDock = (nav, alElegir) => {
  const pildora = nav.querySelector('.dock-pildora');
  const botones = [...nav.querySelectorAll('.dock-btn')];
  const mover = (btn) => {
    const r = btn.getBoundingClientRect();
    const n = nav.getBoundingClientRect();
    nav.style.setProperty('--px', `${r.left - n.left - 1}px`);
    nav.style.setProperty('--pw', `${r.width}px`);
  };
  const elegir = (id, silencioso) => {
    botones.forEach((b) => b.classList.toggle('on', b.dataset.vista === id));
    const b = botones.find((x) => x.dataset.vista === id);
    if (b) mover(b);
    if (!silencioso) alElegir(id);
  };
  botones.forEach((b) => b.addEventListener('click', () => elegir(b.dataset.vista)));
  window.addEventListener('resize', () => { const on = botones.find((b) => b.classList.contains('on')); if (on) mover(on); });
  return {elegir, pildora};
};

/** Confirmación en el sitio: sustituye a un modal. Devuelve una promesa. */
export const confirmarEn = (contenedor, texto, etiqueta = 'Confirmar') =>
  new Promise((resolve) => {
    const d = document.createElement('div');
    d.className = 'confirma';
    d.innerHTML = `<p></p><div class="btn-fila"><button class="btn-secondary" data-no>Cancelar</button><button class="btn-danger" data-si></button></div>`;
    d.querySelector('p').textContent = texto;
    d.querySelector('[data-si]').textContent = etiqueta;
    contenedor.prepend(d);
    d.querySelector('[data-no]').onclick = () => { d.remove(); resolve(false); };
    d.querySelector('[data-si]').onclick = () => { d.remove(); resolve(true); };
  });
