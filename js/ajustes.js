/* Centro de ajustes: una Pantalla titulada «Ajustes» que se abre desde el avatar.
   Orden fijo del sistema: identidad, preferencias, bloques propios, y lo destructivo al final.
   Cada bloque propio abre su formulario en otra Pantalla, cerrando primero la de ajustes. */

import * as A from './almacen.js';
import {esc, imagenAData, descargar, hoyISO, iniciales, aNumero} from './util.js';
import {ICONOS, abrirPantalla, aviso, aplicarTema, temaActual, confirmarEn} from './ui.js';

const ACENTOS = ['#15161b', '#1e3a5f', '#14532d', '#7f1d1d', '#92400e', '#4c1d95'];

const opcionesHTML = (lista, actual) => lista.map((o) => `<option${o === actual ? ' selected' : ''}>${esc(o)}</option>`).join('');

/** Campos genéricos ligados por `data-k` a un objeto. */
const camposHTML = (campos, obj) => campos.map((c) => {
  const v = obj[c.k] ?? '';
  if (c.area) return `<div class="field"><label>${esc(c.label)}</label><textarea data-k="${c.k}" rows="${c.filas || 3}" placeholder="${esc(c.ph || '')}">${esc(v)}</textarea>${c.ayuda ? `<div class="ayuda">${esc(c.ayuda)}</div>` : ''}</div>`;
  if (c.opciones) return `<div class="field"><label>${esc(c.label)}</label><select data-k="${c.k}">${opcionesHTML(c.opciones, v)}</select></div>`;
  return `<div class="field"><label>${esc(c.label)}</label><input data-k="${c.k}" type="${c.tipo || 'text'}" value="${esc(v)}" placeholder="${esc(c.ph || '')}" ${c.modo ? `inputmode="${c.modo}"` : ''} autocomplete="off">${c.ayuda ? `<div class="ayuda">${esc(c.ayuda)}</div>` : ''}</div>`;
}).join('');

const enlazar = (cont, obj) => {
  cont.addEventListener('input', (e) => {
    const k = e.target.dataset?.k;
    if (k) obj[k] = e.target.value;
  });
  cont.addEventListener('change', (e) => {
    const k = e.target.dataset?.k;
    if (k) obj[k] = e.target.value;
  });
};

const interruptor = (k, texto, on) =>
  `<button type="button" class="interruptor${on ? ' on' : ''}" data-sw="${k}" aria-pressed="${on}"><span>${esc(texto)}</span><span class="pista"></span></button>`;

const enlazarInterruptores = (cont, obj) => {
  cont.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sw]');
    if (!b) return;
    obj[b.dataset.sw] = !obj[b.dataset.sw];
    b.classList.toggle('on', !!obj[b.dataset.sw]);
    b.setAttribute('aria-pressed', String(!!obj[b.dataset.sw]));
  });
};

/* ── Datos del emisor ── */
const abrirEmisor = (alCambiar) => {
  const st = A.obtener();
  const e = {...st.emisor};
  const p = abrirPantalla({titulo: 'Datos del emisor', contenido: ''});
  p.cuerpo.innerHTML = `
    <div class="card pad">
      ${camposHTML([
        {k: 'nombre', label: 'Nombre completo o razón social', ph: 'Como aparece en su documento'},
        {k: 'comercial', label: 'Nombre comercial o marca', ph: 'Opcional'},
      ], e)}
      <div class="row2">
        ${camposHTML([{k: 'tipoDoc', label: 'Documento', opciones: ['CC', 'CE', 'NIT', 'Pasaporte']}, {k: 'numDoc', label: 'Número', ph: '1.000.000.000'}], e)}
      </div>
      ${camposHTML([
        {k: 'nit', label: 'NIT (si aplica)', ph: '1000000000-1', ayuda: 'Con el dígito de verificación del RUT. Déjelo vacío si no lo usa.'},
        {k: 'regimen', label: 'Régimen o nota fiscal', ph: 'Persona natural - No responsable de IVA'},
        {k: 'direccion', label: 'Dirección'},
        {k: 'ciudad', label: 'Ciudad', ph: 'Bucaramanga'},
        {k: 'telefono', label: 'Teléfono', modo: 'tel'},
        {k: 'correo', label: 'Correo', tipo: 'email'},
        {k: 'web', label: 'Sitio web', ph: 'Opcional'},
      ], e)}
      ${interruptor('noIva', 'Declarar «no responsable de IVA» por defecto', e.noIva)}
      ${camposHTML([{k: 'textoNoIva', label: 'Texto de la declaración', area: true, filas: 3, ayuda: 'Confirme con su contador que aplica a su situación ante la DIAN antes de usarla.'}], e)}
      <button class="btn-primary" data-guardar style="width:100%">Guardar</button>
    </div>`;
  enlazar(p.cuerpo, e);
  enlazarInterruptores(p.cuerpo, e);
  p.cuerpo.querySelector('[data-guardar]').onclick = () => {
    Object.assign(st.emisor, e);
    if (A.guardar()) { aviso('Datos guardados'); alCambiar(); p.cerrar(); }
  };
};

/* ── Marca: logo, firma y color ── */
const abrirMarca = (alCambiar) => {
  const st = A.obtener();
  const m = {logo: st.emisor.logo, firma: st.emisor.firma, acento: st.emisor.acento, firmaEnDocs: st.defaults.firmaEnDocs};
  const p = abrirPantalla({titulo: 'Marca y firma', contenido: ''});
  const pintar = () => {
    p.cuerpo.innerHTML = `
      <p class="rotulo">Logo</p>
      <div class="muestra"><div class="img">${m.logo ? `<img alt="Logo" src="${m.logo}">` : `<span class="muted">Sin logo</span>`}</div>
        <div class="tx">Aparece arriba a la izquierda de cada PDF. Mejor con fondo transparente o blanco.
          <div class="btn-fila"><button class="btn-secondary" data-subir="logo">${ICONOS.subir} ${m.logo ? 'Cambiar' : 'Subir'}</button>${m.logo ? `<button class="btn-secondary" data-quitar="logo">Quitar</button>` : ''}</div></div></div>
      <p class="rotulo" style="margin-top:20px">Firma</p>
      <div class="muestra"><div class="img">${m.firma ? `<img alt="Firma" src="${m.firma}">` : `<span class="muted">Sin firma</span>`}</div>
        <div class="tx">Foto o escaneo de su firma sobre fondo blanco. Se guarda solo en este dispositivo.
          <div class="btn-fila"><button class="btn-secondary" data-subir="firma">${ICONOS.subir} ${m.firma ? 'Cambiar' : 'Subir'}</button>${m.firma ? `<button class="btn-secondary" data-quitar="firma">Quitar</button>` : ''}</div></div></div>
      ${interruptor('firmaEnDocs', 'Incluir la firma en los documentos nuevos', m.firmaEnDocs)}
      <p class="rotulo" style="margin-top:20px">Color de los PDF</p>
      <div class="card pad"><div class="colores">
        ${ACENTOS.map((c) => `<button type="button" class="color${c === m.acento ? ' on' : ''}" data-color="${c}" style="background:${c}" aria-label="Color ${c}"></button>`).join('')}
        <input class="color-libre" type="color" value="${esc(m.acento)}" data-libre aria-label="Otro color">
      </div><p class="ayuda muted" style="margin-top:10px">Se usa en el título, la línea y la tabla. El diseño de la aplicación no cambia.</p></div>
      <button class="btn-primary" data-guardar style="width:100%;margin-top:22px">Guardar</button>
      <input type="file" accept="image/*" data-archivo hidden>`;
    enlazarInterruptores(p.cuerpo, m);
  };
  pintar();
  let cual = '';
  p.cuerpo.addEventListener('click', async (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.subir) { cual = b.dataset.subir; p.cuerpo.querySelector('[data-archivo]').click(); }
    else if (b.dataset.quitar) { m[b.dataset.quitar] = ''; pintar(); }
    else if (b.dataset.color) { m.acento = b.dataset.color; pintar(); }
    else if (b.dataset.guardar !== undefined) {
      st.emisor.logo = m.logo;
      st.emisor.firma = m.firma;
      st.emisor.acento = m.acento;
      st.defaults.firmaEnDocs = m.firmaEnDocs;
      if (A.guardar()) { aviso('Marca guardada'); alCambiar(); p.cerrar(); }
    }
  });
  p.cuerpo.addEventListener('input', (ev) => { if (ev.target.matches('[data-libre]')) { m.acento = ev.target.value; } });
  p.cuerpo.addEventListener('change', async (ev) => {
    if (ev.target.matches('[data-libre]')) { m.acento = ev.target.value; pintar(); return; }
    if (!ev.target.matches('[data-archivo]')) return;
    const f = ev.target.files[0];
    if (!f) return;
    try {
      m[cual] = await imagenAData(f, cual === 'logo' ? 700 : 600, 'image/png');
      pintar();
    } catch (e) { aviso(e.message, true); }
  });
};

/* ── Métodos de pago ── */
const abrirPagos = (alCambiar) => {
  const st = A.obtener();
  const p = abrirPantalla({titulo: 'Métodos de pago', contenido: ''});
  const lista = () => {
    p.cuerpo.innerHTML = `
      <p class="sub" style="margin-bottom:16px">Los datos que aparecen en el PDF para que le paguen. Puede tener varios y elegir uno en cada documento.</p>
      <div class="lista reveal">${st.pagos.map((x) => `
        <button class="item" data-editar="${x.id}"><div class="r1"><b class="trunca">${esc(x.etiqueta || x.banco || 'Método')}</b></div>
          <div class="r2"><span class="trunca">${esc([x.banco, x.tipo, x.numero].filter(Boolean).join(' · '))}</span></div></button>`).join('') ||
        `<div class="vacio"><div class="ei">${ICONOS.tarjeta}</div>Todavía no hay métodos de pago.</div>`}</div>
      <button class="btn-primary" data-nuevo style="width:100%;margin-top:18px">${ICONOS.mas} Agregar método</button>`;
  };
  lista();
  const form = (pago, esNuevo) => {
    const x = {...pago};
    const f = abrirPantalla({titulo: esNuevo ? 'Nuevo método de pago' : 'Editar método', contenido: ''});
    f.cuerpo.innerHTML = `<div class="card pad">
      ${camposHTML([
        {k: 'etiqueta', label: 'Nombre para reconocerlo', ph: 'Nequi personal'},
        {k: 'banco', label: 'Banco o billetera', ph: 'Bancolombia, Nequi, Daviplata…'},
        {k: 'tipo', label: 'Tipo', opciones: ['Ahorros', 'Corriente', 'Nequi', 'Daviplata', 'Llave', 'Otro']},
        {k: 'numero', label: 'Número de cuenta o celular', modo: 'text'},
        {k: 'titular', label: 'Titular', ph: 'Nombre del titular'},
        {k: 'notas', label: 'Nota (opcional)', area: true, filas: 2},
      ], x)}
      <button class="btn-primary" data-guardar style="width:100%">Guardar</button>
      ${esNuevo ? '' : `<button class="btn-danger" data-borrar style="width:100%;margin-top:10px">${ICONOS.basura} Eliminar</button><div data-conf style="margin-top:10px"></div>`}
    </div>`;
    enlazar(f.cuerpo, x);
    f.cuerpo.querySelector('[data-guardar]').onclick = () => {
      if (!(x.etiqueta || x.banco || x.numero).trim?.()) { aviso('Escriba al menos un nombre o un número', true); return; }
      if (!x.etiqueta) x.etiqueta = x.banco;
      if (A.guardarPago(x)) { aviso('Método guardado'); f.cerrar(); lista(); alCambiar(); }
    };
    f.cuerpo.querySelector('[data-borrar]')?.addEventListener('click', async () => {
      if (await confirmarEn(f.cuerpo.querySelector('[data-conf]'), 'Se eliminará este método de pago.', 'Eliminar')) {
        A.borrarPago(x.id); f.cerrar(); lista(); alCambiar();
      }
    });
  };
  p.cuerpo.addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.nuevo !== undefined) form(A.pagoVacio(), true);
    else if (b.dataset.editar) form(st.pagos.find((x) => x.id === b.dataset.editar), false);
  });
};

/* ── Numeración ── */
const abrirNumeracion = (alCambiar) => {
  const st = A.obtener();
  const n = JSON.parse(JSON.stringify(st.numeracion));
  const p = abrirPantalla({titulo: 'Numeración', contenido: ''});
  p.cuerpo.innerHTML = `<p class="sub" style="margin-bottom:16px">Cada tipo lleva su propio consecutivo. El siguiente número se sugiere solo al crear un documento.</p>
    ${Object.entries(A.TIPOS_DOC).map(([k, t]) => `
      <p class="rotulo">${esc(t.nombre)}</p>
      <div class="card pad" style="margin-bottom:16px"><div class="row3">
        <div class="field"><label>Prefijo</label><input data-n="${k}.prefijo" value="${esc(n[k].prefijo)}"></div>
        <div class="field"><label>Siguiente</label><input data-n="${k}.sig" inputmode="numeric" value="${n[k].sig}"></div>
        <div class="field"><label>Dígitos</label><input data-n="${k}.digitos" inputmode="numeric" value="${n[k].digitos}"></div>
      </div><div class="muted" data-vista="${k}"></div></div>`).join('')}
    <button class="btn-primary" data-guardar style="width:100%">Guardar</button>`;
  const vista = (k) => {
    const c = n[k];
    p.cuerpo.querySelector(`[data-vista="${k}"]`).textContent = `Próximo: ${c.prefijo}${String(Math.max(1, aNumero(c.sig))).padStart(Math.max(1, aNumero(c.digitos)), '0')}`;
  };
  Object.keys(n).forEach(vista);
  p.cuerpo.addEventListener('input', (ev) => {
    const r = ev.target.dataset?.n;
    if (!r) return;
    const [k, campo] = r.split('.');
    n[k][campo] = campo === 'prefijo' ? ev.target.value : Math.max(campo === 'sig' ? 1 : 1, Math.round(aNumero(ev.target.value)) || 1);
    vista(k);
  });
  p.cuerpo.querySelector('[data-guardar]').onclick = () => {
    Object.assign(st.numeracion, n);
    if (A.guardar()) { aviso('Numeración guardada'); alCambiar(); p.cerrar(); }
  };
};

/* ── Valores por defecto ── */
const abrirDefaults = (alCambiar) => {
  const st = A.obtener();
  const d = {...st.defaults};
  const p = abrirPantalla({titulo: 'Valores por defecto', contenido: ''});
  p.cuerpo.innerHTML = `<p class="sub" style="margin-bottom:16px">Se cargan en cada documento nuevo. Siempre se pueden cambiar documento por documento.</p>
    <div class="card pad">
      <div class="row2">${camposHTML([{k: 'ivaPct', label: 'IVA %', modo: 'decimal'}, {k: 'retPct', label: 'Retención %', modo: 'decimal'}], d)}</div>
      ${camposHTML([
        {k: 'retEtiqueta', label: 'Nombre de la retención', ph: 'Retención en la fuente'},
        {k: 'validezDias', label: 'Validez de las cotizaciones (días)', modo: 'numeric'},
        {k: 'anticipoPct', label: 'Anticipo por defecto en cotizaciones (%)', modo: 'decimal'},
        {k: 'notasCot', label: 'Notas por defecto de la cotización', area: true, filas: 3},
        {k: 'pie', label: 'Pie de página de todos los PDF', ph: 'Si lo deja vacío se usa su marca, teléfono y correo'},
      ], d)}
      <button class="btn-primary" data-guardar style="width:100%">Guardar</button>
    </div>`;
  enlazar(p.cuerpo, d);
  p.cuerpo.querySelector('[data-guardar]').onclick = () => {
    d.ivaPct = aNumero(d.ivaPct); d.retPct = aNumero(d.retPct);
    d.validezDias = aNumero(d.validezDias); d.anticipoPct = aNumero(d.anticipoPct);
    Object.assign(st.defaults, d);
    if (A.guardar()) { aviso('Valores guardados'); alCambiar(); p.cerrar(); }
  };
};

/* ── Respaldo ── */
const abrirRespaldo = (alCambiar) => {
  const st = A.obtener();
  let modo = 'combinar';
  const p = abrirPantalla({titulo: 'Respaldo', contenido: ''});
  p.cuerpo.innerHTML = `
    <p class="sub" style="margin-bottom:16px">Sus datos viven solo en este navegador. Para usarlos en otro dispositivo, o por si borra los datos del navegador, guarde un respaldo y luego impórtelo allá. <b>El respaldo lleva su firma y su documento: guárdelo en un lugar privado.</b></p>
    <div class="card pad" style="margin-bottom:16px">
      <p class="rotulo">Resumen</p>
      <div class="stat-grid"><div class="stat"><div class="sv num">${st.docs.length}</div><div class="sl">Documentos</div></div>
        <div class="stat"><div class="sv num">${st.clientes.length}</div><div class="sl">Clientes</div></div></div>
    </div>
    <button class="btn-primary" data-exportar style="width:100%">${ICONOS.respaldo} Descargar respaldo</button>
    <p class="rotulo" style="margin-top:24px">Importar</p>
    <div class="pills" style="margin-bottom:12px">
      <button class="pill on" data-modo="combinar">Sumar a lo que hay</button>
      <button class="pill" data-modo="reemplazar">Reemplazar todo</button>
    </div>
    <button class="btn-secondary" data-importar style="width:100%">${ICONOS.subir} Elegir archivo de respaldo</button>
    <input type="file" accept="application/json,.json" data-archivo hidden>`;
  p.cuerpo.addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.exportar !== undefined) {
      descargar(new Blob([A.exportar()], {type: 'application/json'}), `stickreceipt-respaldo-${hoyISO()}.json`);
      aviso('Respaldo descargado');
    } else if (b.dataset.modo) {
      modo = b.dataset.modo;
      p.cuerpo.querySelectorAll('[data-modo]').forEach((x) => x.classList.toggle('on', x === b));
    } else if (b.dataset.importar !== undefined) p.cuerpo.querySelector('[data-archivo]').click();
  });
  p.cuerpo.addEventListener('change', async (ev) => {
    if (!ev.target.matches('[data-archivo]')) return;
    const f = ev.target.files[0];
    if (!f) return;
    try {
      A.importar(await f.text(), modo);
      aviso('Respaldo importado');
      alCambiar();
      p.cerrar();
    } catch (e) { aviso(e.message || 'No se pudo importar', true); }
  });
};

/* ── Centro de ajustes ── */
export const abrirAjustes = (alCambiar) => {
  const st = A.obtener();
  const e = st.emisor;
  const pendiente = !(e.nombre && e.numDoc);
  const p = abrirPantalla({titulo: 'Ajustes', contenido: ''});
  const pintar = () => {
    const claro = temaActual() === 'claro';
    p.cuerpo.innerHTML = `
      <div class="reveal">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
          <div class="avatar" style="width:48px;height:48px;pointer-events:none">${e.logo ? `<img alt="" src="${e.logo}">` : esc(iniciales(e.nombre || e.comercial))}</div>
          <div style="min-width:0;flex:1"><p class="trunca" style="font-size:14px;font-weight:700;color:var(--zinc-100)">${esc(e.nombre || 'Sin nombre todavía')}</p>
            <p class="muted trunca">${esc([e.tipoDoc && e.numDoc ? `${e.tipoDoc} ${e.numDoc}` : '', e.comercial].filter(Boolean).join(' · ') || 'Complete sus datos de emisor')}</p></div>
        </div>
        <div style="border-top:1px solid var(--linea);padding-top:16px;margin-bottom:20px">
          <p class="rotulo">Preferencias</p>
          <button class="fila" data-tema><span class="izq">${claro ? ICONOS.sol : ICONOS.luna}<span>Tema ${claro ? 'claro' : 'oscuro'}</span></span><span class="der">Cambiar</span></button>
        </div>
        <div style="border-top:1px solid var(--linea);padding-top:16px;margin-bottom:20px">
          <p class="rotulo">Mis documentos</p>
          <button class="fila" data-abrir="emisor"><span class="izq">${ICONOS.usuario}<span>Datos del emisor</span></span>${pendiente ? '<span class="alerta">Pendiente</span>' : '<span class="der">Abrir</span>'}</button>
          <button class="fila" data-abrir="marca"><span class="izq">${ICONOS.marca}<span>Logo, firma y color</span></span><span class="der">${e.logo || e.firma ? 'Configurada' : 'Abrir'}</span></button>
          <button class="fila" data-abrir="pagos"><span class="izq">${ICONOS.tarjeta}<span>Métodos de pago</span></span><span class="der">${st.pagos.length ? st.pagos.length : 'Abrir'}</span></button>
          <button class="fila" data-abrir="numeracion"><span class="izq">${ICONOS.numero}<span>Numeración</span></span><span class="der">Abrir</span></button>
          <button class="fila" data-abrir="defaults"><span class="izq">${ICONOS.sliders}<span>Valores por defecto</span></span><span class="der">Abrir</span></button>
          <button class="fila" data-abrir="respaldo"><span class="izq">${ICONOS.respaldo}<span>Respaldo</span></span><span class="der">Abrir</span></button>
        </div>
        <div style="border-top:1px solid var(--linea);padding-top:16px">
          <div data-conf></div>
          <button class="fila peligro" data-borrar-todo><span class="izq">${ICONOS.basura}<span>Borrar todos los datos de este dispositivo</span></span></button>
        </div>
      </div>`;
  };
  pintar();
  const ir = {emisor: abrirEmisor, marca: abrirMarca, pagos: abrirPagos, numeracion: abrirNumeracion, defaults: abrirDefaults, respaldo: abrirRespaldo};
  p.cuerpo.addEventListener('click', async (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.tema !== undefined) { aplicarTema(temaActual() === 'claro' ? 'oscuro' : 'claro'); st.prefs.tema = temaActual(); A.guardar(); pintar(); return; }
    if (b.dataset.abrir) { const f = ir[b.dataset.abrir]; p.cerrar(true); f(alCambiar); return; }
    if (b.dataset.borrarTodo !== undefined) {
      const ok = await confirmarEn(p.cuerpo.querySelector('[data-conf]'), 'Se borrarán documentos, clientes, firma, logo y ajustes de este dispositivo. Si no tiene un respaldo, no se pueden recuperar.', 'Borrar todo');
      if (ok) { A.borrarTodo(); aviso('Datos borrados'); alCambiar(); p.cerrar(); }
    }
  });
  return p;
};
