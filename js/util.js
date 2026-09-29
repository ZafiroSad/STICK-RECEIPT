/* Utilidades: formato de dinero y fechas, escape de HTML, y el valor en letras. */

export const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

/** Número a partir de lo que escribió el usuario: acepta "1.500.000", "1500000" y "1,5". */
export const aNumero = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  let s = String(v ?? '').trim();
  if (!s) return 0;
  s = s.replace(/[^\d.,-]/g, '');
  // Con punto y coma a la vez, el último signo es el decimal. Con un solo tipo, gana el uso colombiano:
  // "1.500.000" son miles; "1.5" y "1,5" son decimales.
  if (s.includes('.') && s.includes(',')) {
    const dec = s.lastIndexOf(',') > s.lastIndexOf('.') ? ',' : '.';
    const mil = dec === ',' ? '.' : ',';
    s = s.split(mil).join('').replace(dec, '.');
  } else if (s.includes('.')) {
    s = /^-?\d{1,3}(\.\d{3})+$/.test(s) ? s.split('.').join('') : s;
  } else if (s.includes(',')) {
    s = /^-?\d{1,3}(,\d{3})+$/.test(s) ? s.split(',').join('') : s.replace(',', '.');
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

const fmtCOP = new Intl.NumberFormat('es-CO', {maximumFractionDigits: 0});
const fmtDec = new Intl.NumberFormat('es-CO', {minimumFractionDigits: 0, maximumFractionDigits: 2});
export const dinero = (n) => '$ ' + fmtCOP.format(Math.round(aNumero(n)));
export const cantidad = (n) => fmtDec.format(aNumero(n));

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const fechaLarga = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[m - 1]} de ${y}`;
};
export const fechaCorta = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};
export const sumarDias = (iso, dias) => {
  const [y, m, d] = iso.split('-').map(Number);
  const f = new Date(y, m - 1, d + dias);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
};

/* ── Valor en letras ─────────────────────────────────────────────────── */
const U = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece',
  'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés',
  'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const D = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const C = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

const menorMil = (n) => {
  if (n === 100) return 'cien';
  const c = Math.floor(n / 100);
  const r = n % 100;
  let s = c ? C[c] : '';
  if (r) {
    if (s) s += ' ';
    if (r < 30) s += U[r];
    else {
      const d = Math.floor(r / 10);
      const u = r % 10;
      s += D[d] + (u ? ' y ' + U[u] : '');
    }
  }
  return s;
};

// "uno" → "un" y "veintiuno" → "veintiún" cuando van antes de "mil" o de "millones".
const apocope = (t) => t.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un');

const menorMillon = (n) => {
  if (n < 1000) return menorMil(n);
  const m = Math.floor(n / 1000);
  const r = n % 1000;
  let s = m === 1 ? 'mil' : apocope(menorMil(m)) + ' mil';
  if (r) s += ' ' + menorMil(r);
  return s;
};

/** 1.500.000 → "un millón quinientos mil". Llega hasta los billones. */
export const enLetras = (valor) => {
  let n = Math.floor(Math.abs(aNumero(valor)));
  if (n === 0) return {texto: 'cero', redondo: false};
  const partes = [];
  const billones = Math.floor(n / 1e12);
  n %= 1e12;
  const millones = Math.floor(n / 1e6);
  const resto = n % 1e6;
  if (billones) partes.push(billones === 1 ? 'un billón' : apocope(menorMillon(billones)) + ' billones');
  if (millones) partes.push(millones === 1 ? 'un millón' : apocope(menorMillon(millones)) + ' millones');
  const soloRedondo = !resto;
  let texto = partes.join(' ');
  if (resto) texto += (texto ? ' ' : '') + menorMillon(resto);
  else if (texto) texto += ' de';
  return { texto: texto.trim(), redondo: soloRedondo && !!partes.length };
};

/** "SON: QUINIENTOS MIL PESOS M/CTE" (sin el prefijo, en mayúscula inicial). */
export const valorEnLetras = (valor) => {
  const n = Math.round(aNumero(valor));
  if (n === 0) return 'Cero pesos M/CTE';
  if (n === 1) return 'Un peso M/CTE';
  // "un millón" y "dos millones" cerrados llevan "de": "un millón de pesos".
  // Antes de "pesos", uno se apocopa: "veintiún pesos", "ciento un pesos".
  const s = apocope(enLetras(n).texto) + ' pesos M/CTE';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Iniciales para el avatar: "Ana María Pérez Gómez" → "AP". */
export const iniciales = (nombre) => {
  const p = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return 'SD';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length > 2 ? p.length - 2 : p.length - 1][0]).toUpperCase();
};

/** Reduce una imagen subida a un máximo de píxeles y la devuelve como data URL. */
export const imagenAData = (archivo, maximo = 700, tipo = 'image/png') =>
  new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onerror = () => reject(new Error('No se pudo leer el archivo'));
    lector.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('El archivo no es una imagen válida'));
      img.onload = () => {
        const k = Math.min(1, maximo / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * k));
        c.height = Math.max(1, Math.round(img.height * k));
        const ctx = c.getContext('2d');
        if (tipo === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL(tipo, 0.92));
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });

export const descargar = (blob, nombre) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
};

/** Nombre de archivo sin tildes ni caracteres raros. */
export const nombreArchivo = (s) =>
  String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '');
