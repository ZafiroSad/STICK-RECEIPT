// Genera desde la línea de comandos el PDF de un documento guardado en un respaldo, con el mismo
// generador que usa la aplicación. Uso:
//   node tools/emitir-pdf.mjs <respaldo.json> <carpeta-salida> [numero-de-documento] [estilo|todos]
// Sin número, emite todos los documentos del respaldo. Con «todos» genera el documento en los cuatro estilos,
// cada uno con el nombre del estilo delante, para poder elegir.
import {createRequire} from 'node:module';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {dirname, join, resolve} from 'node:path';

const [, , respaldo, salida, numero, estiloArg] = process.argv;
if (!respaldo || !salida) {
  console.error('Uso: node tools/emitir-pdf.mjs <respaldo.json> <carpeta-salida> [numero]');
  process.exit(1);
}

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
globalThis.window = {jspdf: require(join(raiz, 'lib', 'jspdf.umd.min.js'))};
const A = await import(pathToFileURL(join(raiz, 'js', 'almacen.js')).href);
const {construirPDF, nombreDePdf} = await import(pathToFileURL(join(raiz, 'js', 'pdf.js')).href);

const j = JSON.parse(readFileSync(resolve(respaldo), 'utf8'));
const datos = j.datos || j;
const base = A.obtener();
const estado = {...base, ...datos, defaults: {...base.defaults, ...(datos.defaults || {})}, numeracion: {...base.numeracion, ...(datos.numeracion || {})}};

const docs = (datos.docs || []).filter((d) => !numero || d.num === numero);
if (!docs.length) {
  console.error(numero ? `No hay un documento con el número ${numero}` : 'El respaldo no trae documentos');
  process.exit(1);
}
mkdirSync(resolve(salida), {recursive: true});
const estilos = estiloArg === 'todos' ? Object.keys(A.ESTILOS_PDF) : [estiloArg || null];
for (const d of docs) {
  for (const estilo of estilos) {
    const doc = estilo ? {...d, estilo} : d;
    const pdf = construirPDF(estado, doc);
    const nombre = nombreDePdf(doc, estado.emisor);
    const archivo = join(resolve(salida), estiloArg === 'todos' ? `${estilo}_${nombre}` : nombre);
    writeFileSync(archivo, Buffer.from(pdf.output('arraybuffer')));
    console.log('OK', doc.num, estilo || doc.estilo || 'clasico', pdf.getNumberOfPages(), 'pág.', archivo);
  }
}
