// Pruebas de las utilidades de dinero y de letras. Uso:  node tools/probar-util.mjs
import {aNumero, valorEnLetras, dinero, cantidad, formatoVivo, iniciales, nombreArchivo, sumarDias, fechaLarga} from '../js/util.js';

let fallos = 0;
const igual = (nombre, obtenido, esperado) => {
  const ok = obtenido === esperado;
  if (!ok) fallos++;
  console.log(ok ? 'ok   ' : 'FALLA', nombre, ok ? '' : `-> obtuvo ${JSON.stringify(obtenido)}, esperaba ${JSON.stringify(esperado)}`);
};

// Lo que escribe el usuario en un campo de dinero
igual('1.500.000', aNumero('1.500.000'), 1500000);
igual('500.000', aNumero('500.000'), 500000);
igual('1,5', aNumero('1,5'), 1.5);
igual('2.5', aNumero('2.5'), 2.5);
igual('1.234,56', aNumero('1.234,56'), 1234.56);
igual('1,234.56', aNumero('1,234.56'), 1234.56);
igual('500000', aNumero('500000'), 500000);
igual('$ 1.200.000', aNumero('$ 1.200.000'), 1200000);
igual('vacío', aNumero(''), 0);
igual('texto', aNumero('abc'), 0);
igual('número', aNumero(42), 42);

// Valor en letras
const casos = [
  [0, 'Cero pesos M/CTE'],
  [1, 'Un peso M/CTE'],
  [21, 'Veintiún pesos M/CTE'],
  [100, 'Cien pesos M/CTE'],
  [101, 'Ciento un pesos M/CTE'],
  [1000, 'Mil pesos M/CTE'],
  [1001, 'Mil un pesos M/CTE'],
  [21000, 'Veintiún mil pesos M/CTE'],
  [31000, 'Treinta y un mil pesos M/CTE'],
  [100000, 'Cien mil pesos M/CTE'],
  [250000, 'Doscientos cincuenta mil pesos M/CTE'],
  [500000, 'Quinientos mil pesos M/CTE'],
  [1000000, 'Un millón de pesos M/CTE'],
  [1500000, 'Un millón quinientos mil pesos M/CTE'],
  [2000000, 'Dos millones de pesos M/CTE'],
  [21000000, 'Veintiún millones de pesos M/CTE'],
  [1529500, 'Un millón quinientos veintinueve mil quinientos pesos M/CTE'],
  [999999, 'Novecientos noventa y nueve mil novecientos noventa y nueve pesos M/CTE'],
  [1000000000, 'Mil millones de pesos M/CTE'],
  [1234567890, 'Mil doscientos treinta y cuatro millones quinientos sesenta y siete mil ochocientos noventa pesos M/CTE'],
  [1000000000000, 'Un billón de pesos M/CTE'],
];
for (const [n, e] of casos) igual(`letras ${n}`, valorEnLetras(n), e);

igual('dinero', dinero(1234567), '$ 1.234.567');

// Miles con punto, también en números de cuatro cifras
igual('dinero 1000', dinero(1000), '$ 1.000');
igual('dinero 999', dinero(999), '$ 999');
igual('cantidad 1234,5', cantidad(1234.5), '1.234,5');
igual('cantidad 2', cantidad(2), '2');

// Formato mientras se escribe: valor y posición del cursor
const escribir = (texto, pos) => {
  const campo = {value: texto, selectionStart: pos, setSelectionRange(a) { this.pos = a; }};
  formatoVivo(campo);
  return [campo.value, campo.pos ?? pos];
};
igual('vivo 1234', escribir('1234', 4).join('|'), '1.234|5');
igual('vivo 12345', escribir('12345', 5).join('|'), '12.345|6');
igual('vivo 1234567', escribir('1234567', 7).join('|'), '1.234.567|9');
igual('vivo ceros', escribir('0500', 4).join('|'), '500|3');
igual('vivo decimales', escribir('1500,555', 8).join('|'), '1.500,55|8');
igual('vivo letras', escribir('abc12', 5).join('|'), '12|2');
igual('vivo borrar en medio', escribir('1.2345', 3).join('|'), '12.345|2');
igual('el valor se lee de vuelta', aNumero(escribir('1500000', 7)[0]), 1500000);

igual('iniciales 4 palabras', iniciales('Ana María Pérez Gómez'), 'AP');
igual('iniciales vacío', iniciales(''), 'SD');
igual('nombre archivo', nombreArchivo('Cuenta de cobro_CC-001_ACME S.A.S.'), 'Cuenta-de-cobro_CC-001_ACME-S.A.S');
igual('sumar días', sumarDias('2026-09-29', 15), '2026-10-14');
igual('fecha larga', fechaLarga('2026-09-29'), '29 de septiembre de 2026');

console.log(fallos ? `\n${fallos} FALLOS` : '\nTodo en orden');
process.exit(fallos ? 1 : 0);
