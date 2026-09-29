/* Editor de documentos: una sola pantalla para los cinco tipos. El formulario cambia según el tipo,
   los totales se recalculan mientras se escribe y la vista previa es el PDF real. */

import * as A from './almacen.js';
import {esc, aNumero, dinero, cantidad, formatoVivo, valorEnLetras, descargar} from './util.js';
import {construirPDF, nombreDePdf, conValores} from './pdf.js';
import {ICONOS, abrirPantalla, aviso, confirmarEn} from './ui.js';

const UNIDADES = ['und', 'h', 'día', 'sem', 'mes', 'm²', 'ml', 'kg', 'pág', 'global'];
const MEDIOS = ['Transferencia', 'Nequi', 'Daviplata', 'Efectivo', 'Cheque', 'Tarjeta', 'Otro'];

/* Qué muestra cada tipo. `ajustes` = descuento / IVA / retención. */
const CFG = {
  cc: {concepto: 'Concepto: por qué se cobra', ph: 'Producción de video corporativo…', valores: true, ajustes: true, pago: true, noIva: true, campos: []},
  cot: {concepto: 'Descripción o alcance', ph: 'Qué incluye la propuesta…', valores: true, ajustes: true, pago: true, noIva: false, campos: ['validez', 'entrega', 'formaPago', 'anticipo']},
  rec: {concepto: 'Por concepto de', ph: 'Abono al servicio…', valores: true, ajustes: false, pago: false, noIva: true, campos: ['medioPago', 'referencia', 'saldo']},
  os: {concepto: 'Descripción del servicio', ph: 'Servicio que se va a prestar…', valores: true, ajustes: true, pago: true, noIva: false, campos: ['fechas', 'receptor']},
  ent: {concepto: 'Descripción de la entrega', ph: 'Qué se entrega y en qué estado…', valores: false, ajustes: false, pago: false, noIva: false, campos: ['receptor']},
};

const campoHTML = ({k, label, tipo = 'text', valor = '', ph = '', ayuda = '', modo = '', mx = '', dinero: esDinero = false}) => `
  <div class="field"><label>${esc(label)}</label>
    <input data-k="${esc(k)}" ${esDinero ? 'data-dinero' : ''} type="${tipo}" value="${esc(valor)}" placeholder="${esc(ph)}" ${modo ? `inputmode="${modo}"` : ''} ${mx} autocomplete="off">
    ${ayuda ? `<div class="ayuda">${esc(ayuda)}</div>` : ''}</div>`;

const areaHTML = ({k, label, valor = '', ph = '', filas = 4}) => `
  <div class="field"><label>${esc(label)}</label><textarea data-k="${esc(k)}" rows="${filas}" placeholder="${esc(ph)}">${esc(valor)}</textarea></div>`;

const interruptorHTML = (k, texto, on) =>
  `<button type="button" class="interruptor${on ? ' on' : ''}" data-sw="${esc(k)}" aria-pressed="${on ? 'true' : 'false'}"><span>${esc(texto)}</span><span class="pista"></span></button>`;

/** Cómo se muestra un número en un campo al salir de él: "500.000" o "1,5". */
const formatoCampo = (n) => cantidad(n);

const leer = (obj, ruta) => ruta.split('.').reduce((o, p) => (o ? o[p] : undefined), obj);
const escribir = (obj, ruta, v) => {
  const p = ruta.split('.');
  const ult = p.pop();
  const dest = p.reduce((o, k) => o[k], obj);
  dest[ult] = v;
};

export const abrirEditor = (docInicial, {nuevo = false, alCerrar} = {}) => {
  const st = A.obtener();
  const doc = JSON.parse(JSON.stringify(docInicial));
  // Documentos guardados antes de que existieran los estilos se emitieron en el clásico.
  if (!A.ESTILOS_PDF[doc.estilo]) doc.estilo = 'clasico';
  const cfg = CFG[doc.tipo];
  const tipoInfo = A.TIPOS_DOC[doc.tipo];
  const numericos = new Set(['descPct', 'descVal', 'ivaPct', 'retPct', 'validezDias', 'anticipoPct', 'saldo']);

  const ajustesVisibles = cfg.ajustes && (aNumero(doc.descPct) || aNumero(doc.descVal) || aNumero(doc.ivaPct) || aNumero(doc.retPct));
  const conAjustes = { on: !!ajustesVisibles };
  const modoItems = { detalle: doc.tipo === 'cot' || doc.tipo === 'os' || doc.tipo === 'ent' || doc.items.length > 1 };

  const pantalla = abrirPantalla({
    titulo: nuevo ? `${doc.tipo === 'rec' ? 'Nuevo' : 'Nueva'} ${tipoInfo.nombre.toLowerCase()}` : `${tipoInfo.nombre} ${doc.num}`,
    ancha: true,
    alCerrar,
    contenido: '<div class="editor"><div data-form></div><div class="prev" data-prev></div></div>',
  });
  const form = pantalla.cuerpo.querySelector('[data-form]');
  const prev = pantalla.cuerpo.querySelector('[data-prev]');

  /* ── construcción del formulario ── */
  const seccion = (rot, html) => `<div class="seccion" style="margin-top:22px"><p class="rotulo">${esc(rot)}</p><div class="card pad">${html}</div></div>`;

  const itemHTML = (it, i) => `
    <div class="it" data-item="${i}">
      <div class="cab"><span>Ítem ${i + 1}</span>
        ${doc.items.length > 1 ? `<button type="button" class="icon-btn chico" data-quitar="${i}" aria-label="Quitar ítem ${i + 1}" title="Quitar">${ICONOS.basura}</button>` : ''}</div>
      <div class="field"><label>Descripción</label><textarea data-ik="d" data-i="${i}" rows="2" placeholder="Qué se entrega o se cobra">${esc(it.d)}</textarea></div>
      <div class="${cfg.valores ? 'row3' : 'row2'}">
        <div class="field"><label>Cantidad</label><input data-ik="c" data-i="${i}" inputmode="decimal" value="${esc(it.c)}"></div>
        <div class="field"><label>Unidad</label><select data-ik="u" data-i="${i}">${UNIDADES.map((u) => `<option${u === it.u ? ' selected' : ''}>${esc(u)}</option>`).join('')}</select></div>
        ${cfg.valores ? `<div class="field"><label>Valor unitario</label><input data-ik="v" data-dinero data-i="${i}" inputmode="decimal" value="${it.v ? esc(formatoCampo(aNumero(it.v))) : ''}" placeholder="0"></div>` : ''}
      </div>
      ${cfg.valores ? `<div class="sub-t num" data-sub="${i}">${dinero(aNumero(it.c) * aNumero(it.v))}</div>` : ''}
    </div>`;

  const itemsBloque = () => `
    ${doc.items.map(itemHTML).join('')}
    <button type="button" class="btn-secondary" data-agregar style="width:100%">${ICONOS.mas} Agregar ítem</button>`;

  const clienteBloque = () => {
    const opts = st.clientes.map((c) => `<option value="${esc(c.id)}"${c.id === doc.clienteId ? ' selected' : ''}>${esc(c.nombre)}</option>`).join('');
    return `
      ${st.clientes.length ? `<div class="field"><label>Cargar cliente guardado</label><select data-cliente-sel><option value="">- Escribir uno nuevo -</option>${opts}</select></div>` : ''}
      ${campoHTML({k: 'cliente.nombre', label: 'Nombre o razón social', valor: doc.cliente.nombre, ph: 'Empresa S.A.S.'})}
      <div class="row2">
        <div class="field"><label>Tipo de documento</label><select data-k="cliente.tipoDoc">${['NIT', 'CC', 'CE', 'Pasaporte'].map((t) => `<option${t === doc.cliente.tipoDoc ? ' selected' : ''}>${t}</option>`).join('')}</select></div>
        ${campoHTML({k: 'cliente.doc', label: 'Número', valor: doc.cliente.doc, ph: '900.123.456-7'})}
      </div>
      ${campoHTML({k: 'cliente.contacto', label: 'Contacto (opcional)', valor: doc.cliente.contacto})}
      ${campoHTML({k: 'cliente.direccion', label: 'Dirección', valor: doc.cliente.direccion})}
      <div class="row2">
        ${campoHTML({k: 'cliente.ciudad', label: 'Ciudad', valor: doc.cliente.ciudad})}
        ${campoHTML({k: 'cliente.telefono', label: 'Teléfono', valor: doc.cliente.telefono, modo: 'tel'})}
      </div>
      ${campoHTML({k: 'cliente.correo', label: 'Correo', tipo: 'email', valor: doc.cliente.correo})}
      ${interruptorHTML('guardarCliente', 'Guardar este cliente para la próxima vez', doc.guardarCliente)}`;
  };

  const ajustesBloque = () => `
    ${cfg.ajustes ? interruptorHTML('_ajustes', 'Descuento, IVA y retenciones', conAjustes.on) : ''}
    <div data-ajustes ${conAjustes.on ? '' : 'hidden'}>
      <div class="row2">
        ${campoHTML({k: 'descPct', label: 'Descuento %', valor: doc.descPct || '', modo: 'decimal', ph: '0'})}
        ${campoHTML({k: 'descVal', label: 'Descuento en pesos', valor: doc.descVal ? formatoCampo(aNumero(doc.descVal)) : '', modo: 'decimal', ph: '0', dinero: true})}
      </div>
      <div class="row2">
        ${campoHTML({k: 'ivaPct', label: 'IVA %', valor: doc.ivaPct || '', modo: 'decimal', ph: '0'})}
        ${campoHTML({k: 'retPct', label: 'Retención %', valor: doc.retPct || '', modo: 'decimal', ph: '0'})}
      </div>
      ${campoHTML({k: 'retEtiqueta', label: 'Nombre de la retención', valor: doc.retEtiqueta, ayuda: 'Ej.: Retención en la fuente, ReteICA. Se descuenta del total.'})}
    </div>
    <div class="totales" data-totales></div>
    <div class="letras" data-letras></div>`;

  const camposTipo = () => {
    const c = cfg.campos;
    let h = '';
    if (c.includes('validez')) h += `<div class="row2">${campoHTML({k: 'validezDias', label: 'Validez (días)', valor: doc.validezDias, modo: 'numeric'})}${campoHTML({k: 'anticipoPct', label: 'Anticipo %', valor: doc.anticipoPct, modo: 'decimal'})}</div>`;
    if (c.includes('entrega')) h += campoHTML({k: 'entrega', label: 'Tiempo de entrega', valor: doc.entrega, ph: '15 días hábiles tras el anticipo'});
    if (c.includes('formaPago')) h += campoHTML({k: 'formaPago', label: 'Forma de pago', valor: doc.formaPago, ph: '50% al iniciar, 50% al entregar'});
    if (c.includes('medioPago')) h += `<div class="field"><label>Medio de pago</label><select data-k="medioPago">${MEDIOS.map((m) => `<option${m === doc.medioPago ? ' selected' : ''}>${m}</option>`).join('')}</select></div>`;
    if (c.includes('referencia')) h += `<div class="row2">${campoHTML({k: 'referencia', label: 'Referencia (opcional)', valor: doc.referencia})}${campoHTML({k: 'saldo', label: 'Saldo pendiente', valor: doc.saldo ? formatoCampo(aNumero(doc.saldo)) : '', modo: 'decimal', ph: '0', dinero: true})}</div>`;
    if (c.includes('fechas')) h += `<div class="row2">${campoHTML({k: 'inicio', label: 'Inicio', tipo: 'date', valor: doc.inicio})}${campoHTML({k: 'fin', label: 'Entrega', tipo: 'date', valor: doc.fin})}</div>`;
    if (c.includes('receptor')) h += `<div class="row2">${campoHTML({k: 'receptor', label: doc.tipo === 'ent' ? 'Quién recibe' : 'Quién aprueba', valor: doc.receptor, ph: 'Nombre'})}${campoHTML({k: 'cargoReceptor', label: 'Cargo', valor: doc.cargoReceptor})}</div>`;
    return h;
  };

  const pagoBloque = () => {
    if (!cfg.pago && !cfg.noIva) return '';
    let h = '';
    if (cfg.pago) {
      h += interruptorHTML('mostrarPago', 'Mostrar datos para el pago', doc.mostrarPago);
      h += st.pagos.length
        ? `<div class="field" data-pago-sel ${doc.mostrarPago ? '' : 'hidden'}><label>Método de pago</label><select data-k="pagoId">${st.pagos.map((p) => `<option value="${esc(p.id)}"${p.id === doc.pagoId ? ' selected' : ''}>${esc(p.etiqueta || p.banco || 'Método')}</option>`).join('')}</select></div>`
        : `<p class="ayuda muted" data-pago-sel ${doc.mostrarPago ? '' : 'hidden'} style="margin-bottom:12px">Aún no hay métodos de pago. Agréguelos en Ajustes.</p>`;
    }
    if (cfg.noIva) h += interruptorHTML('noIva', 'Incluir declaración de no responsable de IVA', doc.noIva);
    return h;
  };

  const armar = () => {
    form.innerHTML = `
      <div class="reveal">
        ${seccion('Documento', `
          <div class="row2">
            ${campoHTML({k: 'num', label: 'Número', valor: doc.num})}
            ${campoHTML({k: 'fecha', label: 'Fecha', tipo: 'date', valor: doc.fecha})}
          </div>
          ${campoHTML({k: 'lugar', label: 'Ciudad de emisión', valor: doc.lugar})}
          <div class="field"><label>Estado</label><select data-k="estado">${Object.entries(A.ESTADOS).map(([k, v]) => `<option value="${k}"${k === doc.estado ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
          <div class="field" style="margin-bottom:0"><label>Formato del PDF</label><div class="pills" data-estilos>${Object.entries(A.ESTILOS_PDF).map(([k, v]) => `<button type="button" class="pill${k === doc.estilo ? ' on' : ''}" data-estilo="${k}" aria-pressed="${k === doc.estilo}">${esc(v)}</button>`).join('')}</div></div>`)}
        ${seccion('Cliente', clienteBloque())}
        ${seccion(cfg.concepto, areaHTML({k: 'concepto', label: 'Texto', valor: doc.concepto, ph: cfg.ph, filas: 4}))}
        ${seccion(cfg.valores ? 'Ítems y valores' : 'Ítems entregados', `<div data-items>${itemsBloque()}</div>`)}
        ${cfg.valores ? seccion('Totales', ajustesBloque()) : ''}
        ${camposTipo() ? seccion('Condiciones', camposTipo()) : ''}
        ${pagoBloque() ? seccion('Pago y declaraciones', pagoBloque()) : ''}
        ${seccion('Notas y firma', `
          ${areaHTML({k: 'notas', label: doc.tipo === 'cot' ? 'Notas y condiciones' : 'Observaciones', valor: doc.notas, ph: 'Opcional', filas: 3})}
          ${interruptorHTML('incluirFirma', st.emisor.firma ? 'Incluir mi firma escaneada' : 'Incluir firma (cargue una en Ajustes)', doc.incluirFirma && !!st.emisor.firma)}`)}
        <div class="seccion" style="margin-top:26px">
          <div class="btn-fila">
            <button class="btn-primary" data-guardar-pdf style="flex:2 1 220px">${ICONOS.pdf} Guardar y descargar PDF</button>
            <button class="btn-secondary" data-guardar>Guardar</button>
          </div>
          <div class="btn-fila" style="margin-top:10px">
            <button class="btn-secondary" data-vista-movil>${ICONOS.ojo} Ver PDF</button>
            <button class="btn-secondary" data-compartir>${ICONOS.compartir} Compartir</button>
            ${nuevo ? '' : `<button class="btn-danger" data-borrar>${ICONOS.basura} Eliminar</button>`}
          </div>
          <div data-confirmar style="margin-top:12px"></div>
        </div>
      </div>`;
    refrescarTotales();
  };

  /* ── totales en vivo ── */
  const refrescarTotales = () => {
    const t = A.calcular(doc);
    const caja = form.querySelector('[data-totales]');
    if (caja) {
      const filas = [];
      filas.push(['Subtotal', dinero(t.subtotal)]);
      if (t.descuento > 0) filas.push(['Descuento', '- ' + dinero(t.descuento)]);
      if (aNumero(doc.ivaPct) > 0) filas.push([`IVA ${aNumero(doc.ivaPct)}%`, dinero(t.iva)]);
      if (aNumero(doc.retPct) > 0) filas.push([`${doc.retEtiqueta || 'Retención'} ${aNumero(doc.retPct)}%`, '- ' + dinero(t.retencion)]);
      caja.innerHTML = filas.map(([a, b]) => `<div class="l"><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('') +
        `<div class="l gran"><span>Total</span><b>${esc(dinero(t.total))}</b></div>`;
    }
    const l = form.querySelector('[data-letras]');
    if (l) l.textContent = t.total > 0 ? `Son: ${valorEnLetras(t.total)}` : '';
    doc.items.forEach((it, i) => {
      const s = form.querySelector(`[data-sub="${i}"]`);
      if (s) s.textContent = dinero(aNumero(it.c) * aNumero(it.v));
    });
  };

  /* ── vista previa ── */
  let urlPrev = '';
  let temporizador = 0;
  const generar = () => {
    try {
      const pdf = construirPDF(A.obtener(), normalizado());
      return pdf.output('blob');
    } catch (e) {
      console.error(e);
      aviso('No se pudo generar el PDF: ' + e.message, true);
      return null;
    }
  };
  const anchoEscritorio = () => window.matchMedia('(min-width:980px)').matches;
  const pintarPrevia = () => {
    if (!anchoEscritorio()) return;
    const blob = generar();
    if (!blob) return;
    if (urlPrev) URL.revokeObjectURL(urlPrev);
    urlPrev = URL.createObjectURL(blob);
    prev.innerHTML = `<p class="rotulo">Vista previa</p><div class="prev-caja"><iframe title="Vista previa del PDF" src="${urlPrev}#toolbar=0&navpanes=0&view=FitH"></iframe></div>`;
  };
  const programar = () => {
    if (!anchoEscritorio()) return;
    clearTimeout(temporizador);
    temporizador = setTimeout(pintarPrevia, 700);
  };

  /** Copia lista para el PDF y para guardar: números ya convertidos. */
  const normalizado = () => {
    const c = JSON.parse(JSON.stringify(doc));
    c.items = c.items.map((it) => ({d: it.d, c: aNumero(it.c) || 0, u: it.u, v: aNumero(it.v) || 0}));
    for (const k of numericos) c[k] = aNumero(c[k]);
    return c;
  };

  /* ── eventos ── */
  form.addEventListener('input', (e) => {
    const t = e.target;
    if (t.hasAttribute('data-dinero')) formatoVivo(t);
    if (t.dataset.k) {
      escribir(doc, t.dataset.k, t.value);
      if (t.dataset.k.startsWith('cliente.')) doc.clienteId = '';
    } else if (t.dataset.ik) {
      doc.items[+t.dataset.i][t.dataset.ik] = t.value;
    } else return;
    refrescarTotales();
    programar();
  });
  form.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-cliente-sel]')) {
      const c = st.clientes.find((x) => x.id === t.value);
      if (c) {
        doc.cliente = {nombre: c.nombre, tipoDoc: c.tipoDoc, doc: c.doc, direccion: c.direccion, ciudad: c.ciudad, correo: c.correo, telefono: c.telefono, contacto: c.contacto};
        doc.clienteId = c.id;
      } else doc.clienteId = '';
      const cuerpo = form.querySelector('[data-cliente-sel]').closest('.card');
      cuerpo.innerHTML = clienteBloque();
      programar();
      return;
    }
    if (t.dataset.ik === 'c' || t.dataset.ik === 'v') refrescarTotales();
    if (t.dataset.k === 'pagoId' || t.dataset.k === 'estado' || t.dataset.ik === 'u') programar();
  });
  form.addEventListener('focusout', (e) => {
    const t = e.target;
    if (t.dataset.ik === 'c' || t.dataset.ik === 'v') {
      const n = aNumero(t.value);
      doc.items[+t.dataset.i][t.dataset.ik] = n;
      t.value = n ? formatoCampo(n) : '';
    } else if (t.dataset.k && numericos.has(t.dataset.k)) {
      const n = aNumero(t.value);
      doc[t.dataset.k] = n;
      t.value = n ? formatoCampo(n) : '';
    }
    refrescarTotales();
  });

  form.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.estilo) {
      doc.estilo = b.dataset.estilo;
      form.querySelectorAll('[data-estilo]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      pintarPrevia();
      return;
    }
    if (b.dataset.sw) {
      const k = b.dataset.sw;
      if (k === '_ajustes') {
        conAjustes.on = !conAjustes.on;
        b.classList.toggle('on', conAjustes.on);
        b.setAttribute('aria-pressed', String(conAjustes.on));
        form.querySelector('[data-ajustes]').hidden = !conAjustes.on;
        if (!conAjustes.on) { doc.descPct = 0; doc.descVal = 0; doc.ivaPct = 0; doc.retPct = 0; }
      } else {
        doc[k] = !doc[k];
        b.classList.toggle('on', !!doc[k]);
        b.setAttribute('aria-pressed', String(!!doc[k]));
        if (k === 'mostrarPago') form.querySelectorAll('[data-pago-sel]').forEach((x) => { x.hidden = !doc.mostrarPago; });
        if (k === 'incluirFirma' && doc.incluirFirma && !st.emisor.firma) { doc.incluirFirma = false; b.classList.remove('on'); aviso('Cargue su firma en Ajustes, Marca'); }
      }
      refrescarTotales();
      programar();
      return;
    }
    if (b.dataset.agregar !== undefined) {
      doc.items.push({d: '', c: 1, u: 'und', v: 0});
      form.querySelector('[data-items]').innerHTML = itemsBloque();
      refrescarTotales();
      const nuevos = form.querySelectorAll('[data-item] textarea');
      nuevos[nuevos.length - 1]?.focus();
      return;
    }
    if (b.dataset.quitar !== undefined) {
      doc.items.splice(+b.dataset.quitar, 1);
      form.querySelector('[data-items]').innerHTML = itemsBloque();
      refrescarTotales();
      programar();
      return;
    }
    if (b.dataset.guardar !== undefined) { if (guardarDoc(false)) aviso('Guardado'); return; }
    if (b.dataset.guardarPdf !== undefined) { if (guardarDoc(true)) { descargarPdf(); } return; }
    if (b.dataset.vistaMovil !== undefined) { verPdf(); return; }
    if (b.dataset.compartir !== undefined) { compartirPdf(); return; }
    if (b.dataset.borrar !== undefined) {
      const ok = await confirmarEn(form.querySelector('[data-confirmar]'), `Se eliminará ${tipoInfo.nombre.toLowerCase()} ${doc.num}. No se puede deshacer.`, 'Eliminar');
      if (ok) { A.borrarDoc(doc.id); pantalla.cerrar(); aviso('Documento eliminado'); }
    }
  });

  /* ── acciones ── */
  const validar = () => {
    if (!doc.cliente.nombre.trim()) { aviso('Falta el nombre del cliente', true); return false; }
    if (!doc.num.trim()) { aviso('Falta el número del documento', true); return false; }
    const c = normalizado();
    if (conValores(doc.tipo) && A.calcular(c).total <= 0) { aviso('El total debe ser mayor que cero', true); return false; }
    if (!conValores(doc.tipo) && !c.items.some((i) => i.d.trim()) && !c.concepto.trim()) { aviso('Describa qué se entrega', true); return false; }
    return true;
  };

  const guardarDoc = (emitir) => {
    if (!validar()) return false;
    const c = normalizado();
    if (emitir && c.estado === 'borrador') { c.estado = 'emitido'; doc.estado = 'emitido'; }
    if (c.guardarCliente && c.cliente.nombre.trim()) {
      const previo = st.clientes.find((x) => x.id === doc.clienteId) ||
        st.clientes.find((x) => (c.cliente.doc && x.doc === c.cliente.doc) || x.nombre.toLowerCase() === c.cliente.nombre.trim().toLowerCase());
      const cli = {...(previo || A.clienteVacio()), ...c.cliente, nombre: c.cliente.nombre.trim()};
      A.guardarCliente(cli);
      doc.clienteId = cli.id;
      c.clienteId = cli.id;
    }
    const era = A.obtener().docs.some((d) => d.id === c.id);
    if (!A.guardarDoc(c)) return false;
    if (!era) { doc.numSugerido = ''; }
    return true;
  };

  const descargarPdf = () => {
    const c = normalizado();
    const blob = generar();
    if (blob) { descargar(blob, nombreDePdf(c, st.emisor)); aviso('PDF descargado'); }
  };

  const verPdf = () => {
    const blob = generar();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const p = abrirPantalla({
      titulo: `Vista previa ${doc.num}`,
      contenido: `<div class="prev-caja" style="margin-bottom:14px"><iframe title="Vista previa del PDF" src="${url}#toolbar=0&navpanes=0&view=FitH"></iframe></div>
        <div class="btn-fila"><a class="btn-secondary" href="${url}" target="_blank" rel="noopener">${ICONOS.ojo} Abrir en pestaña</a><button class="btn-primary" data-desc>${ICONOS.pdf} Descargar</button></div>`,
      alCerrar: () => URL.revokeObjectURL(url),
    });
    p.cuerpo.querySelector('[data-desc]').onclick = () => { descargar(blob, nombreDePdf(normalizado(), st.emisor)); };
  };

  const compartirPdf = async () => {
    const blob = generar();
    if (!blob) return;
    const archivo = new File([blob], nombreDePdf(normalizado(), st.emisor), {type: 'application/pdf'});
    if (navigator.canShare && navigator.canShare({files: [archivo]})) {
      try { await navigator.share({files: [archivo], title: `${tipoInfo.nombre} ${doc.num}`}); } catch (e) { /* el usuario canceló */ }
    } else {
      descargar(blob, archivo.name);
      aviso('Este navegador no comparte archivos: se descargó el PDF');
    }
  };

  armar();
  pintarPrevia();
  const observarAncho = window.matchMedia('(min-width:980px)');
  const alCambiar = () => { if (observarAncho.matches) pintarPrevia(); else prev.innerHTML = ''; };
  observarAncho.addEventListener?.('change', alCambiar);
  return pantalla;
};
