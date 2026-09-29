/* STICK RECEIPT — arranque y las tres vistas: Emitir, Historial y Clientes.
   El sitio no lleva datos personales: todo se guarda en el navegador de quien lo usa. */

import * as A from './almacen.js';
import {esc, dinero, fechaCorta, hoyISO, iniciales, descargar} from './util.js';
import {ICONOS, aplicarTema, aviso, montarDock, abrirPantalla, confirmarEn} from './ui.js';
import {abrirEditor} from './editor.js';
import {abrirAjustes} from './ajustes.js';
import {blobDePdf, nombreDePdf} from './pdf.js';

const $ = (s, r = document) => r.querySelector(s);

const INFO_TIPO = {
  cc: {ico: ICONOS.cobro, desc: 'Para cobrar un trabajo o servicio sin factura. La que pide una empresa como soporte.'},
  cot: {ico: ICONOS.cotizacion, desc: 'Propuesta económica con ítems, validez, anticipo y condiciones.'},
  rec: {ico: ICONOS.recibo, desc: 'Constancia de que recibió un pago, total o abono, con el saldo pendiente.'},
  os: {ico: ICONOS.orden, desc: 'Autoriza y describe un servicio antes de ejecutarlo, con fechas y firmas.'},
  ent: {ico: ICONOS.entrega, desc: 'Deja constancia de lo que se entregó y de quién lo recibió conforme.'},
};

const filtro = {tipo: 'todos', texto: ''};
let vistaActual = 'nuevo';
let dock = null;

/* ── Arranque ── */
const iniciar = () => {
  A.cargar();
  A.alFallar((m) => aviso(m, true));
  let tema = 'oscuro';
  try { tema = localStorage.getItem('stick:tema') === 'claro' ? 'claro' : A.obtener().prefs.tema || 'oscuro'; } catch (e) { /* sin almacenamiento */ }
  aplicarTema(tema);

  $('[data-recargar]').innerHTML = ICONOS.recargar;
  $('[data-recargar]').addEventListener('click', () => window.location.reload());
  $('[data-avatar]').addEventListener('click', () => abrirAjustes(refrescar));
  $('.fab').innerHTML = ICONOS.mas;
  $('.fab').addEventListener('click', () => abrirFormularioCliente(A.clienteVacio(), true));

  const nav = $('nav.dock');
  nav.querySelectorAll('.dock-btn').forEach((b) => { b.innerHTML = ICONOS[b.dataset.icono]; });
  dock = montarDock(nav, (id) => cambiarVista(id));
  requestAnimationFrame(() => dock.elegir('nuevo', true));
  if (document.fonts?.ready) document.fonts.ready.then(() => dock.elegir(vistaActual, true));

  pintarAvatar();
  cambiarVista('nuevo', true);
  $('#app').hidden = false;
  $('#carga').remove();
  registrarSW();
};

/* ── Avatar y señal de pendiente ── */
const pintarAvatar = () => {
  const e = A.obtener().emisor;
  const pendiente = !(e.nombre && e.numDoc);
  const av = $('[data-avatar]');
  av.innerHTML = `${e.logo ? `<img alt="" src="${e.logo}">` : esc(iniciales(e.nombre || e.comercial))}${pendiente ? '<span class="punto" aria-label="Faltan datos"></span>' : ''}`;
};

const refrescar = () => {
  pintarAvatar();
  pintarVista(vistaActual);
};

/* ── Vistas ── */
const cambiarVista = (id, silencioso) => {
  vistaActual = id;
  document.querySelectorAll('.vista').forEach((v) => v.classList.toggle('on', v.id === `v-${id}`));
  $('.fab').hidden = id !== 'clientes';
  if (!silencioso) window.scrollTo({top: 0, behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth'});
  pintarVista(id);
};

const pintarVista = (id) => {
  if (id === 'nuevo') pintarNuevo();
  else if (id === 'historial') pintarHistorial();
  else if (id === 'clientes') pintarClientes();
};

/* ── Emitir ── */
const pintarNuevo = () => {
  const st = A.obtener();
  const faltan = !(st.emisor.nombre && st.emisor.numDoc);
  $('#v-nuevo').innerHTML = `
    <div class="vista-cab animate-page"><h1 class="h1">Nuevo documento</h1>
      <p class="sub" style="margin-top:6px">Elija qué quiere emitir. El PDF sale listo para enviar.</p></div>
    ${faltan ? `<button class="fila" data-ajustes style="margin-bottom:18px"><span class="izq">${ICONOS.usuario}<span>Complete sus datos de emisor</span></span><span class="alerta">Pendiente</span></button>` : ''}
    <div class="tipos reveal">${Object.entries(A.TIPOS_DOC).map(([k, t]) => `
      <button class="tipo" data-tipo="${k}"><span class="ico">${INFO_TIPO[k].ico}</span>
        <span class="tx"><b>${esc(t.nombre)}</b><span>${esc(INFO_TIPO[k].desc)}</span></span>
        <span class="nx num">${esc(A.proximoNumero(k))}</span></button>`).join('')}</div>`;
  $('#v-nuevo').onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.ajustes !== undefined) abrirAjustes(refrescar);
    else if (b.dataset.tipo) abrirEditor(A.docVacio(b.dataset.tipo, hoyISO()), {nuevo: true, alCerrar: refrescar});
  };
};

/* ── Historial ── */
const totalDoc = (d) => A.calcular(d).total;

const pintarHistorial = () => {
  const st = A.obtener();
  const docs = [...st.docs].sort((a, b) => b.editado - a.editado);
  const suma = (fn) => docs.filter(fn).reduce((s, d) => s + totalDoc(d), 0);
  const porCobrar = suma((d) => d.tipo === 'cc' && d.estado === 'emitido');
  const cobrado = suma((d) => d.tipo === 'cc' && d.estado === 'pagado');
  const cotizado = suma((d) => d.tipo === 'cot' && d.estado !== 'anulado');
  const t = filtro.texto.trim().toLowerCase();
  const visibles = docs.filter((d) =>
    (filtro.tipo === 'todos' || d.tipo === filtro.tipo) &&
    (!t || `${d.num} ${d.cliente.nombre} ${d.concepto}`.toLowerCase().includes(t)));

  $('#v-historial').innerHTML = `
    <div class="vista-cab animate-page"><h1 class="h1">Historial</h1></div>
    <div class="stat-grid reveal">
      <div class="stat"><div class="sv num">${esc(dinero(porCobrar))}</div><div class="sl">Por cobrar</div></div>
      <div class="stat"><div class="sv num">${esc(dinero(cobrado))}</div><div class="sl">Cobrado</div></div>
      <div class="stat"><div class="sv num">${esc(dinero(cotizado))}</div><div class="sl">Cotizado</div></div>
      <div class="stat"><div class="sv num">${docs.length}</div><div class="sl">Documentos</div></div>
    </div>
    <div class="seccion">
      <div class="buscador"><input type="search" data-buscar placeholder="Buscar por número, cliente o concepto" value="${esc(filtro.texto)}" aria-label="Buscar documentos"></div>
      <div class="pills" style="margin-bottom:16px">
        <button class="pill${filtro.tipo === 'todos' ? ' on' : ''}" data-f="todos">Todos</button>
        ${Object.entries(A.TIPOS_DOC).map(([k, x]) => `<button class="pill${filtro.tipo === k ? ' on' : ''}" data-f="${k}">${esc(x.corto)}</button>`).join('')}
      </div>
      <div class="lista reveal" data-lista>${visibles.map(itemDoc).join('') ||
        `<div class="vacio"><div class="ei">${ICONOS.historial}</div>${docs.length ? 'Ningún documento coincide con el filtro.' : 'Todavía no ha emitido ningún documento.'}</div>`}</div>
    </div>`;
  const cont = $('#v-historial');
  cont.oninput = (e) => {
    if (!e.target.matches('[data-buscar]')) return;
    filtro.texto = e.target.value;
    const t2 = filtro.texto.trim().toLowerCase();
    const lista = docs.filter((d) => (filtro.tipo === 'todos' || d.tipo === filtro.tipo) && (!t2 || `${d.num} ${d.cliente.nombre} ${d.concepto}`.toLowerCase().includes(t2)));
    $('[data-lista]').innerHTML = lista.map(itemDoc).join('') || `<div class="vacio"><div class="ei">${ICONOS.historial}</div>Ningún documento coincide.</div>`;
  };
  cont.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.f) { filtro.tipo = b.dataset.f; pintarHistorial(); return; }
    const id = b.dataset.id;
    if (!id) return;
    const doc = st.docs.find((d) => d.id === id);
    if (!doc) return;
    if (b.dataset.acc === 'abrir') abrirEditor(doc, {alCerrar: refrescar});
    else if (b.dataset.acc === 'pdf') {
      try { descargar(blobDePdf(A.obtener(), normalizarDoc(doc)), nombreDePdf(doc, st.emisor)); aviso('PDF descargado'); }
      catch (err) { aviso('No se pudo generar el PDF: ' + err.message, true); }
    } else if (b.dataset.acc === 'dup') {
      const c = A.duplicarDoc(id, hoyISO());
      if (c) abrirEditor(c, {nuevo: true, alCerrar: refrescar});
    } else if (b.dataset.acc === 'pagado') {
      doc.estado = 'pagado';
      A.guardarDoc(doc);
      aviso('Marcado como pagado');
      pintarHistorial();
    }
  };
};

const normalizarDoc = (d) => d; // los documentos guardados ya llevan los números convertidos

const itemDoc = (d) => {
  const t = A.TIPOS_DOC[d.tipo];
  const valores = d.tipo !== 'ent';
  const puedePagar = (d.tipo === 'cc' || d.tipo === 'os' || d.tipo === 'cot') && d.estado !== 'pagado' && d.estado !== 'anulado';
  return `
    <div class="item">
      <div class="r1"><b class="trunca">${esc(t.corto)} ${esc(d.num)}</b><span class="badge ${esc(d.estado)}">${esc(A.ESTADOS[d.estado] || d.estado)}</span></div>
      <div class="r2"><span class="trunca">${esc(d.cliente.nombre || 'Sin cliente')} · ${esc(fechaCorta(d.fecha))}</span>${valores ? `<span class="tot num">${esc(dinero(totalDoc(d)))}</span>` : ''}</div>
      <div class="acc">
        <button class="btn-secondary" data-acc="abrir" data-id="${esc(d.id)}">${ICONOS.editar} Abrir</button>
        <button class="btn-secondary" data-acc="pdf" data-id="${esc(d.id)}">${ICONOS.pdf} PDF</button>
        <button class="btn-secondary" data-acc="dup" data-id="${esc(d.id)}">${ICONOS.copiar} Duplicar</button>
        ${puedePagar ? `<button class="btn-secondary" data-acc="pagado" data-id="${esc(d.id)}">${ICONOS.cheque} Pagado</button>` : ''}
      </div>
    </div>`;
};

/* ── Clientes ── */
const pintarClientes = () => {
  const cl = A.obtener().clientes;
  $('#v-clientes').innerHTML = `
    <div class="vista-cab animate-page"><h1 class="h1">Clientes</h1>
      <p class="sub" style="margin-top:6px">Guárdelos una vez y cárguelos con un toque al emitir.</p></div>
    <div class="lista reveal">${cl.map((c) => `
      <button class="item" data-c="${esc(c.id)}"><div class="r1"><b class="trunca">${esc(c.nombre)}</b></div>
        <div class="r2"><span class="trunca">${esc([c.doc ? `${c.tipoDoc} ${c.doc}` : '', c.ciudad].filter(Boolean).join(' · ') || 'Sin más datos')}</span></div></button>`).join('') ||
      `<div class="vacio"><div class="ei">${ICONOS.clientes}</div>Todavía no hay clientes guardados.<br>Se guardan solos al emitir un documento, o con el botón +.</div>`}</div>`;
  $('#v-clientes').onclick = (e) => {
    const b = e.target.closest('[data-c]');
    if (!b) return;
    const c = A.obtener().clientes.find((x) => x.id === b.dataset.c);
    if (c) abrirFormularioCliente(c, false);
  };
};

const abrirFormularioCliente = (cliente, nuevo) => {
  const c = {...cliente};
  const p = abrirPantalla({titulo: nuevo ? 'Nuevo cliente' : 'Editar cliente', contenido: ''});
  const campo = (k, label, extra = '') => `<div class="field"><label>${label}</label><input data-k="${k}" value="${esc(c[k] || '')}" ${extra} autocomplete="off"></div>`;
  p.cuerpo.innerHTML = `<div class="card pad">
    ${campo('nombre', 'Nombre o razón social')}
    <div class="row2">
      <div class="field"><label>Documento</label><select data-k="tipoDoc">${['NIT', 'CC', 'CE', 'Pasaporte'].map((t) => `<option${t === c.tipoDoc ? ' selected' : ''}>${t}</option>`).join('')}</select></div>
      ${campo('doc', 'Número')}
    </div>
    ${campo('contacto', 'Contacto')}
    ${campo('direccion', 'Dirección')}
    <div class="row2">${campo('ciudad', 'Ciudad')}${campo('telefono', 'Teléfono', 'inputmode="tel"')}</div>
    ${campo('correo', 'Correo', 'type="email"')}
    <button class="btn-primary" data-guardar style="width:100%">Guardar</button>
    ${nuevo ? '' : `<button class="btn-danger" data-borrar style="width:100%;margin-top:10px">${ICONOS.basura} Eliminar</button><div data-conf style="margin-top:10px"></div>`}
  </div>`;
  const alEscribir = (e) => { if (e.target.dataset?.k) c[e.target.dataset.k] = e.target.value; };
  p.cuerpo.addEventListener('input', alEscribir);
  p.cuerpo.addEventListener('change', alEscribir);
  p.cuerpo.querySelector('[data-guardar]').onclick = () => {
    if (!c.nombre.trim()) { aviso('Falta el nombre del cliente', true); return; }
    c.nombre = c.nombre.trim();
    if (A.guardarCliente(c)) { aviso('Cliente guardado'); p.cerrar(); pintarClientes(); }
  };
  p.cuerpo.querySelector('[data-borrar]')?.addEventListener('click', async () => {
    if (await confirmarEn(p.cuerpo.querySelector('[data-conf]'), 'Se eliminará este cliente. Los documentos que ya emitió no se tocan.', 'Eliminar')) {
      A.borrarCliente(c.id); p.cerrar(); pintarClientes(); aviso('Cliente eliminado');
    }
  });
};

/* ── Sin conexión ── */
const registrarSW = () => {
  if (!('serviceWorker' in navigator)) return;
  if (!(location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return;
  navigator.serviceWorker.register('./service-worker.js').catch((e) => console.warn('Service worker no registrado', e));
};

iniciar();
