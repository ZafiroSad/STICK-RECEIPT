/* Generador de PDF (jsPDF, cargado en lib/). Un solo diseño para los cinco tipos de documento:
   cabecera con logo, partes, texto propio del tipo, tabla de ítems, totales, datos de pago,
   notas y firmas. Todo mide en milímetros sobre A4. */

import {TIPOS_DOC, calcular} from './almacen.js';
import {dinero, cantidad, aNumero, valorEnLetras, fechaLarga, fechaCorta, sumarDias, nombreArchivo} from './util.js';

const A4 = {w: 210, h: 297};
const M = 18; // margen
const CW = A4.w - M * 2; // ancho útil
const TINTA = [21, 22, 27];
const GRIS = [107, 114, 128];
const LINEA = [217, 220, 227];
const FONDO = [245, 246, 248];

const rgb = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return TINTA;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// Helvetica estándar solo trae Latin-1: lo que no esté ahí se normaliza para que no salga un símbolo roto.
const limpio = (s) =>
  String(s ?? '')
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-').replace(/…/g, '...').replace(/[•●]/g, '-')
    .replace(/→/g, '->').replace(/\t/g, ' ');

const formatoImg = (data) => (/^data:image\/jpe?g/i.test(data) ? 'JPEG' : 'PNG');

const CAMPOS_TIPO = {
  cc: {titulo: 'CUENTA DE COBRO', valores: true},
  cot: {titulo: 'COTIZACIÓN', valores: true},
  rec: {titulo: 'RECIBO DE PAGO', valores: true},
  os: {titulo: 'ORDEN DE SERVICIO', valores: true},
  ent: {titulo: 'ACTA DE ENTREGA', valores: false},
};

export const conValores = (tipo) => CAMPOS_TIPO[tipo].valores;

export const nombreDePdf = (doc, emisor) => {
  const t = TIPOS_DOC[doc.tipo].nombre;
  const cli = doc.cliente.nombre ? '_' + doc.cliente.nombre : '';
  return nombreArchivo(`${t}_${doc.num}${cli}`).slice(0, 90) + '.pdf';
};

export const construirPDF = (estado, doc) => {
  const {jsPDF} = window.jspdf;
  const pdf = new jsPDF({unit: 'mm', format: 'a4', compress: true});
  const emisor = estado.emisor;
  const cfg = CAMPOS_TIPO[doc.tipo];
  const acento = rgb(emisor.acento);
  const tot = calcular(doc);
  let y = M;

  pdf.setProperties({title: `${cfg.titulo} ${doc.num}`, author: emisor.comercial || emisor.nombre || 'STICK RECEIPT', creator: 'STICK RECEIPT'});

  /* ── utilidades de dibujo ── */
  const color = (c) => pdf.setTextColor(c[0], c[1], c[2]);
  const relleno = (c) => pdf.setFillColor(c[0], c[1], c[2]);
  const trazo = (c, w = 0.2) => { pdf.setDrawColor(c[0], c[1], c[2]); pdf.setLineWidth(w); };
  const fuente = (size, estilo = 'normal') => { pdf.setFont('helvetica', estilo); pdf.setFontSize(size); };
  const lineas = (texto, ancho) => pdf.splitTextToSize(limpio(texto), ancho);
  const salto = (h) => {
    if (y + h > A4.h - M - 6) { pdf.addPage(); y = M; return true; }
    return false;
  };
  const alto = (size) => size * 0.4;

  /** Párrafo con salto de página línea a línea. Devuelve nada; avanza `y`. */
  const parrafo = (texto, {x = M, w = CW, size = 10, estilo = 'normal', col = TINTA, gap = 0, lh = 1.28} = {}) => {
    fuente(size, estilo);
    color(col);
    const paso = alto(size) * lh + 0.6;
    for (const l of lines2(texto, w)) {
      salto(paso);
      pdf.text(l, x, y + alto(size));
      y += paso;
    }
    y += gap;
  };
  const lines2 = (texto, w) => String(limpio(texto)).split('\n').flatMap((p) => (p.trim() === '' ? [''] : pdf.splitTextToSize(p, w)));

  const rotulo = (texto) => {
    salto(9);
    fuente(7.5, 'bold');
    color(GRIS);
    pdf.text(limpio(texto).toUpperCase(), M, y + 2.4, {charSpace: 0.35});
    y += 5.2;
  };

  /* ── cabecera ── */
  const marca = emisor.comercial || emisor.nombre || '';
  let altoCab = 0;
  if (emisor.logo) {
    try {
      const p = pdf.getImageProperties(emisor.logo);
      const hMax = 15;
      const wMax = 52;
      let h = hMax;
      let w = (p.width / p.height) * h;
      if (w > wMax) { w = wMax; h = (p.height / p.width) * w; }
      pdf.addImage(emisor.logo, formatoImg(emisor.logo), M, y, w, h, undefined, 'FAST');
      altoCab = h;
    } catch (e) { console.warn('Logo no válido para el PDF', e); }
  }
  if (!altoCab) {
    fuente(15, 'bold');
    color(TINTA);
    pdf.text(limpio(marca || 'STICK RECEIPT'), M, y + 6);
    altoCab = 8;
  }
  if (emisor.logo && marca) {
    fuente(8, 'normal');
    color(GRIS);
    pdf.text(limpio(marca), M, y + altoCab + 4.2);
    altoCab += 5.5;
  }

  fuente(18, 'bold');
  color(acento);
  pdf.text(cfg.titulo, A4.w - M, y + 6.2, {align: 'right'});
  fuente(10.5, 'bold');
  color(TINTA);
  pdf.text(`N.º ${limpio(doc.num)}`, A4.w - M, y + 12.4, {align: 'right'});
  fuente(8.6, 'normal');
  color(GRIS);
  const lugarFecha = [doc.lugar, fechaLarga(doc.fecha)].filter(Boolean).join(', ');
  pdf.text(limpio(lugarFecha), A4.w - M, y + 17.2, {align: 'right'});
  y += Math.max(altoCab, 19) + 3;
  trazo(acento, 0.7);
  pdf.line(M, y, A4.w - M, y);
  y += 6;

  /* ── partes ── */
  const filasEmisor = () => {
    const f = [];
    f.push([emisor.nombre || marca, 'bold']);
    const id = [emisor.tipoDoc && emisor.numDoc ? `${emisor.tipoDoc} ${emisor.numDoc}` : '', emisor.nit ? `NIT ${emisor.nit}` : ''].filter(Boolean).join('  ·  ');
    if (id) f.push([id]);
    if (emisor.regimen) f.push([emisor.regimen]);
    if (emisor.direccion) f.push([emisor.direccion]);
    if (emisor.ciudad) f.push([emisor.ciudad]);
    if (emisor.telefono) f.push([emisor.telefono]);
    if (emisor.correo) f.push([emisor.correo]);
    if (emisor.web) f.push([emisor.web]);
    return f;
  };
  const filasCliente = () => {
    const c = doc.cliente;
    const f = [];
    f.push([c.nombre || '(sin cliente)', 'bold']);
    if (c.doc) f.push([`${c.tipoDoc || 'NIT'} ${c.doc}`]);
    if (c.contacto) f.push([`Atn: ${c.contacto}`]);
    if (c.direccion) f.push([c.direccion]);
    if (c.ciudad) f.push([c.ciudad]);
    if (c.telefono) f.push([c.telefono]);
    if (c.correo) f.push([c.correo]);
    return f;
  };
  const caja = (x, w, rot, filas) => {
    fuente(9.2);
    const cont = filas.flatMap(([t, e]) => lineas(t, w - 10).map((l) => [l, e]));
    const h = 8.4 + cont.length * 4.4 + 3;
    return {x, w, rot, cont, h};
  };
  const gap = 6;
  const wCaja = (CW - gap) / 2;
  const izq = caja(M, wCaja, doc.tipo === 'rec' ? 'Recibí de' : 'Cliente', filasCliente());
  const der = caja(M + wCaja + gap, wCaja, doc.tipo === 'cc' ? 'Debe a' : doc.tipo === 'rec' ? 'Recibido por' : doc.tipo === 'ent' ? 'Entrega' : 'Emisor', filasEmisor());
  const hCaja = Math.max(izq.h, der.h);
  salto(hCaja + 4);
  for (const c of [izq, der]) {
    relleno(FONDO);
    trazo(LINEA, 0.2);
    pdf.roundedRect(c.x, y, c.w, hCaja, 2.2, 2.2, 'FD');
    fuente(7.2, 'bold');
    color(GRIS);
    pdf.text(limpio(c.rot).toUpperCase(), c.x + 5, y + 5.6, {charSpace: 0.35});
    let yy = y + 11;
    for (const [l, e] of c.cont) {
      fuente(9.2, e === 'bold' ? 'bold' : 'normal');
      color(e === 'bold' ? TINTA : [55, 60, 72]);
      pdf.text(l, c.x + 5, yy);
      yy += 4.4;
    }
  }
  y += hCaja + 7;

  /* ── texto propio de cada tipo ── */
  const cli = doc.cliente.nombre || 'el cliente';
  const idCli = doc.cliente.doc ? ` (${doc.cliente.tipoDoc || 'NIT'} ${doc.cliente.doc})` : '';
  const idEmi = emisor.numDoc ? ` (${emisor.tipoDoc || 'CC'} ${emisor.numDoc})` : '';
  const nomEmi = emisor.nombre || marca || 'el emisor';
  const letras = valorEnLetras(tot.total);

  if (doc.tipo === 'cc') {
    parrafo(`${cli}${idCli} debe a ${nomEmi}${idEmi} la suma de:`, {size: 10.2, gap: 1.5});
    parrafo(`${dinero(tot.total)}`, {size: 17, estilo: 'bold', col: acento, gap: 0.5});
    parrafo(`(${letras})`, {size: 9.4, col: GRIS, gap: 4});
    if (doc.concepto) { rotulo('Por concepto de'); parrafo(doc.concepto, {gap: 3}); }
  } else if (doc.tipo === 'rec') {
    parrafo(`Recibí de ${cli}${idCli} la suma de:`, {size: 10.2, gap: 1.5});
    parrafo(`${dinero(tot.total)}`, {size: 17, estilo: 'bold', col: acento, gap: 0.5});
    parrafo(`(${letras})`, {size: 9.4, col: GRIS, gap: 4});
    if (doc.concepto) { rotulo('Por concepto de'); parrafo(doc.concepto, {gap: 3}); }
    const extra = [];
    if (doc.medioPago) extra.push(`Medio de pago: ${doc.medioPago}`);
    if (doc.referencia) extra.push(`Referencia: ${doc.referencia}`);
    if (aNumero(doc.saldo) > 0) extra.push(`Saldo pendiente: ${dinero(doc.saldo)}`);
    if (extra.length) parrafo(extra.join('   ·   '), {size: 9.4, col: GRIS, gap: 3});
  } else if (doc.tipo === 'cot') {
    parrafo(`Presentamos a ${cli} la siguiente propuesta económica${doc.concepto ? ':' : ' por los servicios detallados a continuación.'}`, {gap: 2});
    if (doc.concepto) parrafo(doc.concepto, {gap: 3});
  } else if (doc.tipo === 'os') {
    parrafo(`Se autoriza a ${nomEmi} la ejecución del servicio descrito a continuación para ${cli}${idCli}.`, {gap: 2});
    if (doc.concepto) { rotulo('Descripción del servicio'); parrafo(doc.concepto, {gap: 2}); }
    const fechas = [];
    if (doc.inicio) fechas.push(`Inicio: ${fechaLarga(doc.inicio)}`);
    if (doc.fin) fechas.push(`Entrega: ${fechaLarga(doc.fin)}`);
    if (fechas.length) parrafo(fechas.join('   ·   '), {size: 9.4, col: GRIS, gap: 3});
  } else if (doc.tipo === 'ent') {
    parrafo(`${nomEmi} hace entrega formal a ${cli}${idCli} de lo siguiente, quedando el receptor conforme con lo recibido.`, {gap: 2});
    if (doc.concepto) { rotulo('Descripción'); parrafo(doc.concepto, {gap: 2}); }
  }

  /* ── tabla de ítems ── */
  const items = doc.items.filter((it) => (it.d || '').trim() || aNumero(it.v));
  if (items.length) {
    const cols = cfg.valores
      ? [{k: 'n', w: 8, a: 'left', t: '#'}, {k: 'd', w: CW - 8 - 16 - 16 - 30 - 32, a: 'left', t: 'Descripción'}, {k: 'c', w: 16, a: 'right', t: 'Cant.'}, {k: 'u', w: 16, a: 'left', t: 'Und.'}, {k: 'v', w: 30, a: 'right', t: 'Vr. unitario'}, {k: 't', w: 32, a: 'right', t: 'Valor'}]
      : [{k: 'n', w: 8, a: 'left', t: '#'}, {k: 'd', w: CW - 8 - 22 - 26, a: 'left', t: 'Descripción'}, {k: 'c', w: 22, a: 'right', t: 'Cant.'}, {k: 'u', w: 26, a: 'left', t: 'Unidad'}];
    const dibujarCabecera = () => {
      relleno(acento);
      pdf.roundedRect(M, y, CW, 8, 1.6, 1.6, 'F');
      fuente(8, 'bold');
      color([255, 255, 255]);
      let x = M;
      for (const c of cols) {
        const tx = c.a === 'right' ? x + c.w - 2.5 : x + 2.5;
        pdf.text(limpio(c.t).toUpperCase(), tx, y + 5.3, {align: c.a === 'right' ? 'right' : 'left', charSpace: 0.2});
        x += c.w;
      }
      y += 9;
    };
    salto(24);
    dibujarCabecera();
    fuente(9.2);
    items.forEach((it, i) => {
      const dl = lineas(it.d || '', cols[1].w - 5);
      const h = Math.max(8, dl.length * 4.3 + 3.6);
      if (y + h > A4.h - M - 6) { pdf.addPage(); y = M; dibujarCabecera(); }
      if (i % 2 === 1) { relleno(FONDO); pdf.rect(M, y - 0.4, CW, h, 'F'); }
      fuente(9.2);
      color(TINTA);
      let x = M;
      const vals = {
        n: String(i + 1),
        c: cantidad(it.c),
        u: it.u || '',
        v: dinero(it.v),
        t: dinero(aNumero(it.c) * aNumero(it.v)),
      };
      for (const c of cols) {
        if (c.k === 'd') {
          dl.forEach((l, j) => pdf.text(l, x + 2.5, y + 5 + j * 4.3));
        } else {
          const tx = c.a === 'right' ? x + c.w - 2.5 : x + 2.5;
          pdf.text(limpio(vals[c.k]), tx, y + 5, {align: c.a === 'right' ? 'right' : 'left'});
        }
        x += c.w;
      }
      trazo(LINEA, 0.15);
      pdf.line(M, y + h - 0.4, A4.w - M, y + h - 0.4);
      y += h;
    });
    y += 4;
  }

  /* ── totales ── */
  if (cfg.valores) {
    const filasTot = [];
    const hayAjustes = tot.descuento > 0 || aNumero(doc.ivaPct) > 0 || aNumero(doc.retPct) > 0;
    if (hayAjustes) filasTot.push(['Subtotal', dinero(tot.subtotal)]);
    if (tot.descuento > 0) filasTot.push([`Descuento${aNumero(doc.descPct) ? ` (${cantidad(doc.descPct)}%)` : ''}`, '- ' + dinero(tot.descuento)]);
    if (aNumero(doc.ivaPct) > 0) filasTot.push([`IVA (${cantidad(doc.ivaPct)}%)`, dinero(tot.iva)]);
    if (aNumero(doc.retPct) > 0) filasTot.push([`${doc.retEtiqueta || 'Retención'} (${cantidad(doc.retPct)}%)`, '- ' + dinero(tot.retencion)]);
    const wT = 84;
    const xT = A4.w - M - wT;
    salto(filasTot.length * 6 + 16);
    for (const [r, v] of filasTot) {
      fuente(9.2);
      color(GRIS);
      pdf.text(limpio(r), xT + 2, y + 4);
      color(TINTA);
      pdf.text(limpio(v), A4.w - M - 2, y + 4, {align: 'right'});
      y += 6;
    }
    relleno(TINTA);
    pdf.roundedRect(xT, y + 1, wT, 10.5, 2.2, 2.2, 'F');
    fuente(8.4, 'bold');
    color([255, 255, 255]);
    pdf.text('TOTAL', xT + 4, y + 7.7, {charSpace: 0.35});
    fuente(12, 'bold');
    pdf.text(limpio(dinero(tot.total)), A4.w - M - 4, y + 8.1, {align: 'right'});
    y += 16;
    if (doc.tipo !== 'cc' && doc.tipo !== 'rec') {
      parrafo(`Son: ${letras}.`, {size: 9, estilo: 'bold', col: GRIS, gap: 3});
    }
  }

  /* ── condiciones de la cotización ── */
  if (doc.tipo === 'cot') {
    const cond = [];
    if (aNumero(doc.validezDias) > 0) cond.push(`Validez de la oferta: ${aNumero(doc.validezDias)} días (hasta el ${fechaLarga(sumarDias(doc.fecha, aNumero(doc.validezDias)))}).`);
    if (doc.entrega) cond.push(`Tiempo de entrega: ${doc.entrega}.`);
    if (doc.formaPago) cond.push(`Forma de pago: ${doc.formaPago}.`);
    if (aNumero(doc.anticipoPct) > 0) cond.push(`Anticipo: ${aNumero(doc.anticipoPct)}% (${dinero(tot.total * aNumero(doc.anticipoPct) / 100)}) para iniciar el trabajo.`);
    if (cond.length) { rotulo('Condiciones'); cond.forEach((c) => parrafo('- ' + c, {size: 9.4, gap: 0.6})); y += 3; }
  }

  /* ── datos de pago ── */
  const pago = estado.pagos.find((p) => p.id === doc.pagoId);
  if (doc.mostrarPago && pago) {
    const filas = [];
    const tipoPago = pago.tipo && pago.tipo !== pago.banco ? pago.tipo : '';
    const banco = [pago.banco, tipoPago].filter(Boolean).join(' - ');
    if (banco) filas.push(['Banco / medio', banco]);
    if (pago.numero) filas.push(['Número', pago.numero]);
    if (pago.titular) filas.push(['Titular', pago.titular]);
    if (pago.notas) filas.push(['Nota', pago.notas]);
    if (filas.length) {
      fuente(9.2);
      const wV = CW - 46;
      const lv = filas.map(([, v]) => lineas(v, wV));
      const h = 11 + lv.reduce((s, l) => s + Math.max(1, l.length) * 4.5 + 0.8, 0) + 1;
      salto(h + 3);
      relleno(FONDO);
      trazo(LINEA, 0.2);
      pdf.roundedRect(M, y, CW, h, 2.2, 2.2, 'FD');
      fuente(7.2, 'bold');
      color(GRIS);
      pdf.text('DATOS PARA EL PAGO', M + 5, y + 5.6, {charSpace: 0.35});
      let yy = y + 11.4;
      filas.forEach(([k], i) => {
        fuente(8.6, 'bold');
        color(GRIS);
        pdf.text(limpio(k), M + 5, yy);
        fuente(9.4, 'normal');
        color(TINTA);
        lv[i].forEach((l, j) => pdf.text(l, M + 42, yy + j * 4.5));
        yy += Math.max(1, lv[i].length) * 4.5 + 0.8;
      });
      y += h + 5;
    }
  }

  if (doc.noIva && emisor.textoNoIva) parrafo(emisor.textoNoIva, {size: 8.8, col: GRIS, gap: 3});
  if (doc.notas) { rotulo(doc.tipo === 'cot' ? 'Notas' : 'Observaciones'); parrafo(doc.notas, {size: 9.2, gap: 3}); }

  /* ── firmas ── */
  const firmar = (x, w, etiqueta, nombre, detalle, imagen) => {
    if (imagen) {
      try {
        const p = pdf.getImageProperties(imagen);
        const h = 14;
        const wi = Math.min(w - 10, (p.width / p.height) * h);
        pdf.addImage(imagen, formatoImg(imagen), x + (w - wi) / 2, y, wi, h, undefined, 'FAST');
      } catch (e) { console.warn('Firma no válida', e); }
    }
    trazo(TINTA, 0.25);
    pdf.line(x, y + 15.5, x + w, y + 15.5);
    fuente(9, 'bold');
    color(TINTA);
    pdf.text(limpio(nombre || ' '), x + w / 2, y + 20, {align: 'center'});
    fuente(8, 'normal');
    color(GRIS);
    pdf.text(limpio(detalle || etiqueta), x + w / 2, y + 24, {align: 'center'});
  };
  const necesitaFirma = doc.tipo !== 'cot';
  if (necesitaFirma) {
    salto(30);
    y += 4;
    const w1 = 74;
    if (doc.tipo === 'ent') {
      firmar(M, w1, 'Entrega', nomEmi, [emisor.tipoDoc && emisor.numDoc ? `${emisor.tipoDoc} ${emisor.numDoc}` : '', 'Entrega'].filter(Boolean).join(' · '), doc.incluirFirma ? emisor.firma : '');
      firmar(A4.w - M - w1, w1, 'Recibe', doc.receptor || doc.cliente.nombre, [doc.cargoReceptor, 'Recibe conforme'].filter(Boolean).join(' · '));
    } else if (doc.tipo === 'os') {
      firmar(M, w1, 'Emisor', nomEmi, [emisor.tipoDoc && emisor.numDoc ? `${emisor.tipoDoc} ${emisor.numDoc}` : '', 'Prestador'].filter(Boolean).join(' · '), doc.incluirFirma ? emisor.firma : '');
      firmar(A4.w - M - w1, w1, 'Cliente', doc.receptor || doc.cliente.nombre, [doc.cargoReceptor, 'Aprueba'].filter(Boolean).join(' · '));
    } else {
      firmar(M, w1, 'Firma', nomEmi, emisor.numDoc ? `${emisor.tipoDoc || 'CC'} ${emisor.numDoc}` : 'Firma', doc.incluirFirma ? emisor.firma : '');
    }
    y += 27;
  }

  /* ── pie y numeración ── */
  const n = pdf.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    pdf.setPage(i);
    trazo(LINEA, 0.2);
    pdf.line(M, A4.h - M + 1, A4.w - M, A4.h - M + 1);
    fuente(7.6, 'normal');
    color(GRIS);
    const pie = limpio(estado.defaults.pie || [marca, emisor.telefono, emisor.correo].filter(Boolean).join('  ·  '));
    if (pie) pdf.text(pie, M, A4.h - M + 5.4, {maxWidth: CW - 30});
    pdf.text(`${limpio(doc.num)}  ·  Página ${i} de ${n}`, A4.w - M, A4.h - M + 5.4, {align: 'right'});
  }

  return pdf;
};

export const blobDePdf = (estado, doc) => construirPDF(estado, doc).output('blob');
