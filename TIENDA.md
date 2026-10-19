# Tienda local AnimeStorage

Abre el proyecto con Live Server o ejecuta `python -m http.server 8000` desde la carpeta del proyecto y visita `http://localhost:8000`. Usa siempre el mismo origen (host y puerto) para compartir los datos entre páginas.

- `landing/catalogo.html`: búsqueda, géneros, reseñas y productos con precios en CLP.
- `landing/carrito.html`: cantidades de 1 a 99, eliminación, resumen y confirmación de pedidos de prueba.
- `landing/admin.html`: crear, editar y eliminar animes. Para imágenes locales usa una ruta como `assets/img/Sanda.jpg`; también se aceptan URLs HTTPS.
- `JavaScript/components/database.js`: operaciones y persistencia en `localStorage`.
- `JavaScript/components/anime-seed.js`: diez productos iniciales y precios de ejemplo.

Los cambios se reflejan al navegar y entre pestañas del mismo navegador y origen. Los precios y títulos de cada pedido quedan guardados como estaban al comprar; las futuras ediciones no modifican el historial. Eliminar un anime lo retira también del carrito.

Este es un prototipo local: Admin no tiene autenticación, los datos no se comparten entre personas o dispositivos y no existe un cobro real ni entrega de contenido. No ingreses datos bancarios ni credenciales reales. Para una tienda pública se necesitan servidor, base de datos, autenticación con permisos y un proveedor de pagos. No se deben usar los precios ni permisos del navegador como autoridad para pagos reales.

Al borrar los datos del sitio se pierden los productos editados, el carrito y los pedidos; se vuelve al catálogo inicial. Si se bloquea el almacenamiento o se agota el espacio, la interfaz informa que no pudo guardar. No sobrescribe automáticamente una base ilegible.

Pruebas: `node --test tests/store.test.cjs`.
