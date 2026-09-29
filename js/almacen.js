/* Almacén: todo lo que la herramienta recuerda vive en el navegador (localStorage).
   Nada sale del dispositivo: el sitio es público y no lleva ningún dato personal.
   Para pasar los datos a otro dispositivo se usa el respaldo (exportar / importar JSON). */

import {uid, aNumero} from './util.js';

const CLAVE = 'stickreceipt-v1';

export const TIPOS_DOC = {
  cc: {nombre: 'Cuenta de cobro', corto: 'Cuenta de cobro', prefijo: 'CC-'},
  cot: {nombre: 'Cotización', corto: 'Cotización', prefijo: 'COT-'},
  rec: {nombre: 'Recibo de pago', corto: 'Recibo de pago', prefijo: 'RP-'},
  os: {nombre: 'Orden de servicio', corto: 'Orden de servicio', prefijo: 'OS-'},
  ent: {nombre: 'Acta de entrega', corto: 'Acta de entrega', prefijo: 'AE-'},
};

export const ESTADOS = {
  borrador: 'Borrador',
  emitido: 'Emitido',
  pagado: 'Pagado',
  anulado: 'Anulado',
};

const porDefecto = () => ({
  v: 1,
  emisor: {
    nombre: '', tipoDoc: 'CC', numDoc: '', nit: '', comercial: '', ciudad: '', direccion: '',
    telefono: '', correo: '', web: '', regimen: '',
    noIva: false,
    textoNoIva: 'Manifiesto que no soy responsable del impuesto sobre las ventas (IVA).',
    logo: '', firma: '', acento: '#15161b',
  },
  pagos: [],
  numeracion: Object.fromEntries(
    Object.entries(TIPOS_DOC).map(([k, t]) => [k, {prefijo: t.prefijo, sig: 1, digitos: 3}]),
  ),
  defaults: {
    ivaPct: 0, retPct: 0, retEtiqueta: 'Retención en la fuente',
    validezDias: 15, anticipoPct: 50,
    notasCot: 'Precios en pesos colombianos (COP).',
    pie: '',
    firmaEnDocs: true,
  },
  clientes: [],
  docs: [],
  prefs: {tema: 'oscuro'},
});

const mezclar = (base, dato) => {
  if (Array.isArray(base) || typeof base !== 'object' || base === null) return dato === undefined ? base : dato;
  const salida = {...base};
  if (dato && typeof dato === 'object' && !Array.isArray(dato)) {
    for (const k of Object.keys(dato)) salida[k] = k in base ? mezclar(base[k], dato[k]) : dato[k];
  }
  return salida;
};

let estado = porDefecto();
const oyentes = new Set();
let avisoCuota = null;

export const cargar = () => {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (crudo) estado = mezclar(porDefecto(), JSON.parse(crudo));
  } catch (e) {
    console.warn('No se pudo leer el almacén, se parte de cero', e);
    estado = porDefecto();
  }
  return estado;
};

export const obtener = () => estado;

export const guardar = () => {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
    oyentes.forEach((f) => f(estado));
    return true;
  } catch (e) {
    if (avisoCuota) avisoCuota('No hay espacio para guardar. Reduzca el logo o la firma, o borre documentos viejos.');
    return false;
  }
};

export const alGuardar = (f) => { oyentes.add(f); return () => oyentes.delete(f); };
export const alFallar = (f) => { avisoCuota = f; };

/* ── Numeración ─────────────────────────────────────────────────────── */
export const formatoNumero = (tipo, n) => {
  const c = estado.numeracion[tipo];
  return `${c.prefijo}${String(n).padStart(c.digitos, '0')}`;
};
export const proximoNumero = (tipo) => formatoNumero(tipo, estado.numeracion[tipo].sig);

/** Consume el consecutivo. Solo se llama al guardar un documento nuevo con el número sugerido. */
export const consumirNumero = (tipo) => {
  estado.numeracion[tipo].sig += 1;
};

/* ── Clientes ───────────────────────────────────────────────────────── */
export const clienteVacio = () => ({
  id: uid(), nombre: '', tipoDoc: 'NIT', doc: '', direccion: '', ciudad: '', correo: '', telefono: '', contacto: '',
});

export const guardarCliente = (c) => {
  const i = estado.clientes.findIndex((x) => x.id === c.id);
  if (i >= 0) estado.clientes[i] = c;
  else estado.clientes.push(c);
  estado.clientes.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  return guardar();
};
export const borrarCliente = (id) => {
  estado.clientes = estado.clientes.filter((c) => c.id !== id);
  return guardar();
};

/* ── Métodos de pago ────────────────────────────────────────────────── */
export const pagoVacio = () => ({id: uid(), etiqueta: '', banco: '', tipo: 'Ahorros', numero: '', titular: '', notas: ''});
export const guardarPago = (p) => {
  const i = estado.pagos.findIndex((x) => x.id === p.id);
  if (i >= 0) estado.pagos[i] = p;
  else estado.pagos.push(p);
  return guardar();
};
export const borrarPago = (id) => {
  estado.pagos = estado.pagos.filter((p) => p.id !== id);
  return guardar();
};

/* ── Documentos ─────────────────────────────────────────────────────── */
export const docVacio = (tipo, hoy) => {
  const d = estado.defaults;
  const e = estado.emisor;
  return {
    id: uid(), tipo, num: proximoNumero(tipo), numSugerido: proximoNumero(tipo), fecha: hoy, lugar: e.ciudad || '',
    cliente: {nombre: '', tipoDoc: 'NIT', doc: '', direccion: '', ciudad: '', correo: '', telefono: '', contacto: ''},
    guardarCliente: true,
    concepto: '',
    items: [{d: '', c: 1, u: 'und', v: 0}],
    descPct: 0, descVal: 0, ivaPct: d.ivaPct, retPct: d.retPct, retEtiqueta: d.retEtiqueta,
    pagoId: estado.pagos[0]?.id || '', mostrarPago: tipo === 'cc' || tipo === 'cot' || tipo === 'os',
    noIva: e.noIva && (tipo === 'cc' || tipo === 'rec'),
    incluirFirma: d.firmaEnDocs && !!e.firma,
    notas: tipo === 'cot' ? d.notasCot : '',
    // Campos propios de cada tipo
    validezDias: d.validezDias, entrega: '', formaPago: '', anticipoPct: d.anticipoPct,
    medioPago: 'Transferencia', referencia: '', saldo: 0,
    inicio: '', fin: '', receptor: '', cargoReceptor: '',
    estado: 'borrador',
    creado: Date.now(), editado: Date.now(),
  };
};

export const guardarDoc = (doc) => {
  doc.editado = Date.now();
  const i = estado.docs.findIndex((x) => x.id === doc.id);
  if (i >= 0) estado.docs[i] = doc;
  else {
    estado.docs.push(doc);
    // El consecutivo solo avanza si el usuario dejó el número que se le sugirió.
    if (doc.num === doc.numSugerido) consumirNumero(doc.tipo);
  }
  return guardar();
};
export const borrarDoc = (id) => {
  estado.docs = estado.docs.filter((d) => d.id !== id);
  return guardar();
};
export const duplicarDoc = (id, hoy) => {
  const o = estado.docs.find((d) => d.id === id);
  if (!o) return null;
  const c = JSON.parse(JSON.stringify(o));
  c.id = uid();
  c.num = proximoNumero(c.tipo);
  c.numSugerido = c.num;
  c.fecha = hoy;
  c.estado = 'borrador';
  c.creado = Date.now();
  c.editado = Date.now();
  return c;
};

/* ── Cálculo de totales ─────────────────────────────────────────────── */
export const calcular = (doc) => {
  const num = aNumero;
  const subtotal = doc.items.reduce((s, it) => s + num(it.c) * num(it.v), 0);
  const descuento = Math.min(subtotal, subtotal * (num(doc.descPct) / 100) + num(doc.descVal));
  const base = subtotal - descuento;
  const iva = base * (num(doc.ivaPct) / 100);
  const retencion = base * (num(doc.retPct) / 100);
  const total = base + iva - retencion;
  return {subtotal, descuento, base, iva, retencion, total};
};

/* ── Respaldo ───────────────────────────────────────────────────────── */
export const exportar = () => JSON.stringify({app: 'STICK RECEIPT', version: 1, exportado: new Date().toISOString(), datos: estado}, null, 2);

export const importar = (texto, modo = 'reemplazar') => {
  let j;
  try { j = JSON.parse(texto); } catch (e) { throw new Error('El archivo no es un respaldo válido (no se puede leer como JSON)'); }
  const datos = j.datos || j;
  if (!datos || typeof datos !== 'object' || !('emisor' in datos || 'docs' in datos || 'clientes' in datos)) {
    throw new Error('El archivo no parece un respaldo de STICK RECEIPT');
  }
  if (modo === 'reemplazar') estado = mezclar(porDefecto(), datos);
  else {
    const nuevo = mezclar(porDefecto(), datos);
    const unir = (a, b) => {
      const ids = new Set(a.map((x) => x.id));
      return [...a, ...b.filter((x) => !ids.has(x.id))];
    };
    estado.clientes = unir(estado.clientes, nuevo.clientes);
    estado.pagos = unir(estado.pagos, nuevo.pagos);
    estado.docs = unir(estado.docs, nuevo.docs);
  }
  return guardar();
};

export const borrarTodo = () => {
  estado = porDefecto();
  try { localStorage.removeItem(CLAVE); } catch (e) { /* sin acceso, se ignora */ }
  oyentes.forEach((f) => f(estado));
};
