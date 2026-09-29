# CLAUDE.md — STICK DOCS

Bitácora viva. **Leer primero, siempre, antes de tocar nada.**

## 1. Qué es

Herramienta del Señor Stick para emitir en PDF, cuando quiera y desde cualquier dispositivo, sus **cuentas de cobro, cotizaciones, recibos de pago, órdenes de servicio y actas de entrega**. Nació el 2026-09-29 porque una empresa cliente pidió una cuenta de cobro como soporte de un pago, y el Señor Stick pidió "algo completo, para no volver a pedírtelo".

Sitio estático, sin build, pensado para **GitHub Pages sirviendo `main` directo, sin workflows** (igual que STICK FIT y STICK QUANTITY).

## 2. Estado actual

**v1.0.0 — construida y verificada en local; sin publicar.**

Verificado en vivo (navegador integrado, 375 px y 1280 px, oscuro y claro): flujo completo de emitir una cuenta de cobro con datos reales, guardado, consecutivos, historial, duplicar, las seis pantallas de ajustes sin scroll lateral ni errores de consola, respaldo (exportar, reemplazar, combinar, archivos inválidos), escape de HTML en nombres, validaciones. Los cinco PDF más un caso de 26 ítems (tres páginas) se generaron con `node tools/probar-pdf.mjs` y se revisaron como imagen. Dinero y valor en letras: 40 comprobaciones en `tools/probar-util.mjs`.

**No verificado:** el funcionamiento sin conexión (el navegador integrado no registra service workers), la vista previa del PDF con `view=FitH` (el visor del navegador integrado la ignora), compartir con `navigator.share` y todo en un iPhone real.

## 3. Decisiones — no re-litigar sin discusión explícita

1. **El sitio es público y no lleva un solo dato personal.** GitHub Pages es público aunque el repo sea privado (salvo planes de pago). Por eso cédula, NIT, firma, logo, clientes y teléfono viven **solo en el `localStorage` del navegador** y viajan con un respaldo JSON. Los datos del Señor Stick están en `privado/mis-datos.json`, **ignorado por Git**, y se cargan una vez con Ajustes → Respaldo. Los placeholders del código son genéricos a propósito.
2. **Cinco tipos de documento** (Cuenta de cobro, Cotización, Recibo de pago, Orden de servicio, Acta de entrega) sobre **un solo editor y un solo diseño de PDF**. El Señor Stick pidió "por lo menos 4"; el quinto casi no cuesta.
3. **Los ítems son la fuente del total en todos los tipos**, incluida la cuenta de cobro (una sola línea). Descuento, IVA y retención van detrás de un interruptor para no ensuciar el caso simple. La retención se llama como el usuario quiera ("Retención en la fuente", "ReteICA") y **resta** del total.
4. **El consecutivo solo avanza si el usuario dejó el número sugerido.** Un número escrito a mano no consume la secuencia. Los borradores sí consumen número.
5. **El cliente se guarda solo al emitir** (casilla activa por defecto) y cada documento guarda **una copia** de los datos del cliente: editar un cliente después no altera documentos ya emitidos.
6. **La vista previa es el PDF real**, no un espejo en HTML. En escritorio (≥ 980 px) va en dos columnas con regeneración a 700 ms; en teléfono, "Ver PDF" abre otra Pantalla. Evita mantener dos renderizadores que se desalineen.
7. **jsPDF vendorizado en `lib/`**, no por CDN: la regla 24 del sistema prohíbe CDN, y así funciona sin conexión. Fuente del PDF: Helvetica estándar (solo Latin-1); `limpio()` en `pdf.js` normaliza comillas, guiones largos y flechas para que no salga un símbolo roto.
8. **La declaración "no responsable de IVA" viene apagada por defecto** y su texto es editable: no se sabe la situación del Señor Stick ante la DIAN y no se cita artículo alguno. Confirmar con un contador.
9. **Diseño: STICK UI SYSTEM v2, réplica en CSS puro** (como FIT, QUANTITY y DLI: los valores son los del sistema, no Tailwind). Header de dos controles (recargar y avatar), centro de ajustes en Pantalla con el orden de bloques de §11, dock de tres iconos sin texto, formularios en Pantalla, confirmaciones en el sitio, disco flotante de 56 px solo en Clientes, modo claro obligatorio, hover con puntero fino. **Sin fuentes externas, sin emojis.**
10. **Excepciones respecto al canon (§23):** sin `motion` ni `layoutId` (la píldora del dock viaja con CSS y `--px`/`--pw`, como FIT); sin gráficas, así que no aplican las reglas de dona ni de cifras que cuentan.
11. **`requestAnimationFrame` prohibido para mostrar el aviso.** Si la pestaña no pinta, rAF se pospone y el temporizador de salida corría antes que la entrada: el aviso quedaba pegado. Se usa reflow forzado.

## 4. Arquitectura

Ver `README.md` para el mapa de archivos. Lo que no está ahí:

- **Almacén** (`almacen.js`): clave `stickdocs-v1` en `localStorage`; `mezclar()` completa con valores por defecto lo que falte, así que agregar un campo nuevo no rompe datos viejos. `borrarTodo()` e `importar()` **reasignan** el objeto de estado: quien guarde una referencia a `obtener()` durante mucho tiempo la deja obsoleta (las pantallas se cierran tras esas acciones).
- **Logo y firma** se reducen a 700 y 600 px y se guardan como data URL en el mismo `localStorage` (~5 MB de tope). Si se llena, `alFallar` avisa.
- **PDF** (`pdf.js`): A4, márgenes de 18 mm, cabecera con logo, dos cajas de partes, texto propio del tipo, tabla con salto de página que repite la cabecera, totales, datos de pago, firmas y pie con "Página X de Y". El límite inferior del contenido es `A4.h - M - 6`; el bloque de firma pide 36 mm.
- **Pruebas sin navegador:** `tools/probar-pdf.mjs` corre `pdf.js` en Node con un `window.jspdf` postizo y usa `privado/mis-datos.json` si existe, o datos de muestra si no.

## 5. Cómo se usa el archivo privado

`privado/generar-mis-datos.py` (ignorado por Git) lee el logo de `99. RECURSOS MARCA`, la firma de `01. PERSONAL` y escribe `privado/mis-datos.json`. Se importa en Ajustes → Respaldo → *Reemplazar todo*. Hay que repetirlo en cada dispositivo nuevo (el JSON viaja por Drive o WhatsApp) y cuando se cambie la firma.

## 6. Pendientes y problemas conocidos

- [ ] **Publicar**: crear el repo `ZafiroSad/STICK-DOCS`, activar Pages sobre `main` y probar allí el service worker y el modo sin conexión. Repo público (Pages), sin datos personales.
- [ ] Probar en un iPhone real: compartir el PDF, anti-zoom, safe areas, teclado.
- [ ] El visor de PDF de la vista previa no siempre ajusta al ancho (`view=FitH`); si en Chrome/Safari reales se ve cortado, cambiar por una vista rasterizada.
- [ ] Datos que el Señor Stick debe completar en Ajustes: dirección, correo, y confirmar su método de pago.
- [ ] Ideas aparte, no pedidas: enviar el PDF por WhatsApp desde la herramienta; plantillas de conceptos frecuentes; contrato de prestación de servicios como sexto tipo.

## 7. Historial

- **2026-09-29 — v1.0.0.** Construida en una tarde a partir de la petición de una cuenta de cobro. Se probó de punta a punta con datos reales en el navegador integrado y se dejó el navegador limpio al terminar. Hallazgos que costaron: los iconos SVG sin tamaño se expanden a todo el botón (regla `.btn-* svg`), el `requestAnimationFrame` pospuesto (decisión 11), y una firma escaneada de 4,4 MB que hubo que recortar y reducir a 180 KB.
