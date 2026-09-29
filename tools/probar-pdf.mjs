// Prueba de los PDF sin navegador: genera un documento de cada tipo con los datos de privado/mis-datos.json
// y los deja en la carpeta que se pase como argumento. Uso:  node tools/probar-pdf.mjs <carpeta-salida>
import {createRequire} from 'node:module';
import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'node:fs';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const salida = process.argv[2] || join(raiz, 'privado', 'pdf-prueba');
mkdirSync(salida, {recursive: true});

const require = createRequire(import.meta.url);
globalThis.window = {jspdf: require(join(raiz, 'lib', 'jspdf.umd.min.js'))};

const A = await import(pathToFileURL(join(raiz, 'js', 'almacen.js')).href);
const {construirPDF, nombreDePdf} = await import(pathToFileURL(join(raiz, 'js', 'pdf.js')).href);

// Con los datos reales si existen (privado/mis-datos.json, fuera del repositorio); si no, con datos de muestra.
const rutaDatos = join(raiz, 'privado', 'mis-datos.json');
const muestra = {
  emisor: {nombre: 'NOMBRE APELLIDO', comercial: 'MARCA', tipoDoc: 'CC', numDoc: '1.000.000.000', nit: '', regimen: 'Persona natural', direccion: 'Calle 1 # 2-3', ciudad: 'Ciudad', telefono: '300 000 0000', correo: 'correo@ejemplo.com', web: '', noIva: false, textoNoIva: 'Manifiesto que no soy responsable del impuesto sobre las ventas (IVA).', logo: '', firma: '', acento: '#15161b'},
  pagos: [{id: 'pago-nequi', etiqueta: 'Nequi', banco: 'Nequi', tipo: 'Nequi', numero: '300 000 0000', titular: 'Nombre Apellido', notas: ''}],
  clientes: [{id: 'cli', nombre: 'CLIENTE S.A.S.', tipoDoc: 'NIT', doc: '900.000.000-0', direccion: 'Carrera 1 # 2-3', ciudad: 'Ciudad', correo: 'cliente@ejemplo.com', telefono: '310 000 0000', contacto: 'Nombre Apellido, representante legal'}],
};
const datos = existsSync(rutaDatos) ? JSON.parse(readFileSync(rutaDatos, 'utf8')).datos : muestra;
const st = {...A.obtener(), ...datos};
st.numeracion = A.obtener().numeracion;
st.defaults = A.obtener().defaults;
st.pagos = datos.pagos;

const cliente = {...datos.clientes[0]};
delete cliente.id;
const base = (tipo) => {
  const d = {
    tipo, num: `${A.TIPOS_DOC[tipo].prefijo}001`, fecha: '2026-09-29', lugar: 'Bucaramanga', cliente,
    concepto: '', items: [], descPct: 0, descVal: 0, ivaPct: 0, retPct: 0, retEtiqueta: 'Retención en la fuente',
    pagoId: 'pago-nequi', mostrarPago: false, noIva: false, incluirFirma: true, notas: '',
    validezDias: 15, entrega: '', formaPago: '', anticipoPct: 0, medioPago: 'Transferencia', referencia: '', saldo: 0,
    inicio: '', fin: '', receptor: '', cargoReceptor: '', estado: 'emitido',
  };
  return d;
};

const docs = [];
{
  const d = base('cc');
  d.concepto = 'Producción de un video corporativo de 110 segundos para el cliente: guion, locución, animación y tres rondas de correcciones.';
  d.items = [{d: 'Video corporativo (versión final)', c: 1, u: 'global', v: 500000}];
  d.mostrarPago = true;
  d.noIva = true;
  docs.push(d);
}
{
  const d = base('cot');
  d.concepto = 'Propuesta para un segundo video de 60 segundos con animación 3D del proceso.';
  d.items = [
    {d: 'Guion y storyboard', c: 1, u: 'global', v: 350000},
    {d: 'Animación 3D del proceso de beneficio, incluye modelado de la planta, cámara y render en 4K con locución en español y subtítulos quemados para redes.', c: 45, u: 'seg', v: 18000},
    {d: 'Rondas de corrección adicionales', c: 2, u: 'und', v: 120000},
  ];
  d.descPct = 5; d.ivaPct = 19; d.retPct = 4; d.retEtiqueta = 'Retención en la fuente';
  d.validezDias = 15; d.entrega = '20 días hábiles'; d.formaPago = 'Transferencia'; d.anticipoPct = 50;
  d.mostrarPago = true; d.notas = 'Precios en pesos colombianos (COP).';
  docs.push(d);
}
{
  const d = base('rec');
  d.concepto = 'Abono del 50% del video corporativo.';
  d.items = [{d: 'Abono video corporativo', c: 1, u: 'und', v: 250000}];
  d.medioPago = 'Nequi'; d.referencia = 'M1234567'; d.saldo = 250000;
  docs.push(d);
}
{
  const d = base('os');
  d.concepto = 'Producción de un video de 60 segundos con animación 3D.';
  d.items = [{d: 'Video 60 s', c: 1, u: 'global', v: 1500000}];
  d.inicio = '2026-10-05'; d.fin = '2026-10-30'; d.receptor = 'Nombre Apellido'; d.cargoReceptor = 'Representante legal';
  d.mostrarPago = true;
  docs.push(d);
}
{
  const d = base('ent');
  d.concepto = 'Entrega de los archivos finales del video corporativo.';
  d.items = [
    {d: 'video-final.mp4 (1920x1080, 110 s)', c: 1, u: 'und', v: 0},
    {d: 'Guion y locución en audio WAV', c: 1, u: 'und', v: 0},
  ];
  d.receptor = 'Nombre Apellido'; d.cargoReceptor = 'Representante legal';
  docs.push(d);
}
{
  // Caso límite: muchos ítems para forzar salto de página
  const d = base('cot');
  d.items = Array.from({length: 26}, (_, i) => ({d: `Ítem de prueba número ${i + 1} con una descripción un poco larga para comprobar el ajuste de línea dentro de la tabla`, c: i + 1, u: 'und', v: 12345 * (i + 1)}));
  d.concepto = 'Prueba de paginado.';
  d.ivaPct = 19;
  d.num = 'COT-999';
  docs.push(d);
}

for (const d of docs) {
  const pdf = construirPDF(st, d);
  const nombre = nombreDePdf(d, st.emisor);
  writeFileSync(join(salida, `${d.tipo}-${d.num}.pdf`), Buffer.from(pdf.output('arraybuffer')));
  console.log('OK', d.tipo, d.num, pdf.getNumberOfPages(), 'pág.', nombre);
}
