/* Valores habituales para los menús desplegables. Cada menú tiene además «Otro…» para escribir uno distinto. */

export const CIUDADES = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta',
  'Barrancabermeja', 'Cúcuta', 'Pereira', 'Manizales', 'Armenia', 'Ibagué', 'Neiva', 'Popayán', 'Pasto', 'Tunja',
  'Villavicencio', 'Yopal', 'Santa Marta', 'Valledupar', 'Riohacha', 'Sincelejo', 'Montería', 'San Martín de Loba',
];

export const BANCOS = [
  'Bancolombia', 'Davivienda', 'Banco de Bogotá', 'BBVA', 'Banco de Occidente', 'Banco Popular', 'Banco AV Villas',
  'Banco Caja Social', 'Scotiabank Colpatria', 'Itaú', 'Banco Falabella', 'Bancoomeva', 'Nequi', 'Daviplata', 'Nu',
  'Lulo Bank', 'Ualá', 'Movii', 'RappiPay',
];

export const OPCIONES = {
  descuento: ['0', '5', '10', '15', '20', '25', '30'],
  iva: ['0', '5', '19'],
  retencion: ['0', '1', '2', '3.5', '4', '6', '10', '11'],
  retencionNombre: ['Retención en la fuente', 'ReteICA', 'ReteIVA'],
  validez: ['7', '15', '30', '45', '60', '90'],
  anticipo: ['0', '20', '30', '40', '50', '60', '100'],
  entrega: ['Inmediata', '3 días hábiles', '5 días hábiles', '10 días hábiles', '15 días hábiles', '20 días hábiles', '30 días calendario'],
  formaPago: ['Transferencia bancaria', 'Contra entrega', '50% al iniciar y 50% al entregar', '30% al iniciar, 40% en avance y 30% al entregar', 'Efectivo', 'A 30 días'],
  cargos: ['Representante legal', 'Gerente', 'Director de proyecto', 'Jefe de obra', 'Interventor', 'Contratante'],
  regimen: ['Persona natural - No responsable de IVA', 'Persona natural - Responsable de IVA', 'Régimen simple de tributación', 'Persona jurídica'],
};
