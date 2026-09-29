# STICK RECEIPT

Emite **cuentas de cobro, cotizaciones, recibos de pago, órdenes de servicio y actas de entrega** en PDF, desde el navegador y sin servidor. Sirve en el teléfono y en el computador, y funciona sin conexión una vez cargada.

**Sitio:** https://zafirosad.github.io/STICK-RECEIPT/

## Qué hace

| Documento | Para qué |
|---|---|
| Cuenta de cobro | Cobrar un trabajo o servicio sin factura; lleva valor en letras, datos de pago y, si se quiere, la declaración de no responsable de IVA |
| Cotización | Propuesta con ítems, descuento, IVA, retención, validez, anticipo y condiciones |
| Recibo de pago | Constancia de un pago o abono, con medio de pago, referencia y saldo pendiente |
| Orden de servicio | Autoriza y describe un servicio, con fechas y firmas de las dos partes |
| Acta de entrega | Constancia de lo entregado y de quién lo recibió conforme |

- Logo, firma escaneada y color del PDF configurables.
- Clientes y métodos de pago guardados, para cargarlos con un toque.
- Numeración consecutiva por tipo, con prefijo propio.
- Historial con búsqueda, filtro por tipo, estados (borrador, emitido, pagado, anulado) y totales por cobrar.
- Vista previa del PDF real mientras se escribe (escritorio) y compartir por la hoja del sistema (teléfono).
- Respaldo en un archivo JSON, para pasar los datos a otro dispositivo.

## Privacidad

**El sitio no lleva ningún dato personal.** Todo lo que se escribe (datos del emisor, firma, clientes, documentos) se guarda únicamente en el navegador de quien lo usa, en `localStorage`. Nada se envía a ningún servidor. Por lo mismo, los datos no viajan de un dispositivo a otro solos: se pasan con **Ajustes → Respaldo**. El respaldo incluye la firma y el número de documento, así que se guarda en un lugar privado.

## Cómo se usa la primera vez

1. Abrir el sitio y tocar el avatar (arriba a la derecha) → **Ajustes**.
2. Completar *Datos del emisor*, subir el logo y la firma en *Logo, firma y color*, y agregar un método de pago.
3. Volver a *Emitir*, elegir el tipo de documento y llenar el formulario. El PDF se descarga con **Guardar y descargar PDF**.

## Desarrollo

Sitio estático sin paso de compilación: HTML, CSS y JavaScript de módulos. La única dependencia es [jsPDF](https://github.com/parallax/jsPDF) (MIT), incluida en `lib/`.

```
index.html          estructura de la aplicación
estilos.css         sistema visual STICK (campo, vidrio, píldoras, modo claro)
js/app.js           arranque y las vistas: Emitir, Historial, Clientes
js/editor.js        editor de documentos (los cinco tipos)
js/ajustes.js       centro de ajustes y sus pantallas
js/pdf.js           generador de PDF
js/almacen.js       datos, numeración, cálculo de totales y respaldo
js/util.js          dinero, fechas, valor en letras
js/ui.js            iconos, Pantalla, aviso, dock y tema
service-worker.js   funcionamiento sin conexión
tools/              pruebas sin navegador
```

Servir en local (los módulos no cargan con `file://`):

```bash
python -m http.server 4173
```

Pruebas sin navegador:

```bash
node tools/probar-util.mjs        # dinero y valor en letras
node tools/probar-pdf.mjs salida  # un PDF de cada tipo en la carpeta «salida»
```

Al publicar un cambio, subir `VERSION` en `service-worker.js` para que los dispositivos renueven la caché.

## Licencias

El código de la aplicación es de STICK INDUSTRIES. jsPDF conserva su licencia MIT (`lib/jspdf-LICENSE.txt`).
