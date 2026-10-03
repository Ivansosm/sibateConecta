# SIBATÉ Conecta — MVP 1.0

PWA privada para validar la intermediación de hospedaje y alimentación entre estudiantes temporales de la ESJIM y prestadores locales en Sibaté. Es una iniciativa independiente, sin vínculo institucional ni identidad visual de la Policía Nacional.

## Alcance entregado

- Inicio de sesión con ChatGPT y perfil inicial Estudiante/Prestador.
- Catálogo con dos categorías, búsqueda, filtros por zona y precio, orden por precio y disponibilidad.
- Detalle, características, precio y favoritos persistentes.
- Solicitudes con fecha, cantidad, mensaje y desglose de precio base, tarifa y total.
- Panel de prestador con creación, edición, pausa de publicaciones y gestión de solicitudes.
- Estados Pendiente → Aceptada/Rechazada/Cancelada; Aceptada → Completada/Cancelada.
- Valoraciones de servicios completados.
- Administración del piloto, operaciones y tarifa configurable.
- Manifest, iconos, service worker, navegación móvil y catálogo de consulta sin conexión.
- Persistencia en Cloudflare D1 con datos aislados por usuario autenticado. La copia local del catálogo es solo de consulta; el servidor es la fuente de verdad.

## Qué representa este piloto

Cada usuario trabaja en su propio espacio privado de prueba. Las vistas Estudiante, Prestador y Administración permiten representar los distintos actores del flujo dentro de ese mismo espacio. No hay todavía intercambio entre cuentas independientes, validación de pertenencia a ESJIM, cobros, pasarela de pagos, mensajería externa ni reservas comerciales garantizadas.

Las seis ofertas iniciales son ejemplos. Las fotografías fueron generadas para ilustrar el catálogo y no corresponden a prestadores verificados. Las publicaciones nuevas también se tratan como datos de prueba. Hospedaje se cotiza por un periodo de 30 días; alimentación por unidad. No se calcula prorrateo, disponibilidad por calendario o inventario de cupos por fecha.

La tarifa inicial de **5 %** es un supuesto configurable del piloto, no una decisión comercial definitiva. Se cobra solo al estudiante en la simulación. No se aplica comisión al prestador. Cada solicitud conserva el precio y la tarifa al momento de crearla.

## Demostración

1. Inicia sesión y crea tu perfil con un nombre de prueba.
2. Busca la habitación de $475.000 COP y abre su detalle.
3. Selecciona fecha desde hoy. El desglose es $475.000 + $23.750 de tarifa = $498.750.
4. Confirma la solicitud de prueba y revisa Mis solicitudes.
5. Abre Panel del prestador, acepta la solicitud y luego marca Completada.
6. Regresa a Mis solicitudes para valorar el servicio.
7. Publica una nueva oferta o pausa una existente; comprueba el catálogo.
8. En Administración cambia el porcentaje: solo afecta solicitudes nuevas.
9. Instala la app usando el navegador. Ábrela con conexión antes de probar el catálogo sin internet.

## Desarrollo

Node.js >=22.13, npm y Git. Frontend React 19 y Vinext/Vite; API TypeScript; Cloudflare Workers y D1; migraciones Drizzle. No se requieren servicios comerciales de pago para la prueba.

```sh
npm ci --prefer-offline --no-audit --no-fund
npm run db:generate # Solo si cambias db/schema.ts
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_aromatic_rick_jones.sql
npm run dev
```

Aplica cada migración una sola vez. El servidor portátil usa la simulación local de inicio de sesión del starter en `/signin-with-chatgpt?return_to=/`. Esa simulación no se incluye en producción. La autenticación publicada la administra Sites.

`.openai/hosting.json` identifica el Site existente. Reutiliza su `project_id` al actualizarlo. Nunca publiques `.sites-runtime`, `.wrangler`, `.env`, credenciales ni la base de datos local. No modifiques migraciones ya aplicadas; genera otras para cambios posteriores.

## Seguridad y consistencia implementadas

La API exige identidad autenticada, limita las consultas y mutaciones al propietario del espacio y comprueba el origen de las mutaciones. Valida campos, fechas, disponibilidad, cantidad, tarifa y transiciones. Calcula el total en el servidor y rechaza cotizaciones que hayan cambiado. Una clave por solicitud evita registros duplicados al reintentar. Los valores quedan parametrizados en SQL y las reseñas se admiten únicamente después de completar el servicio.

No se guardan perfiles ni solicitudes en el caché offline. Solo se almacena una copia del catálogo sin identificador de propietario. Cerrar sesión elimina esa copia. No hay cola de escrituras offline: para guardar, solicitar o responder se necesita conexión.

## Verificación realizada

- Compilación para Workers y comprobación de TypeScript.
- Migración aplicada a D1 local: seis tablas, sin datos de ejemplo en migraciones.
- API sin sesión devuelve 401.
- Consentimiento de perfil obligatorio.
- Favoritos persistentes.
- Solicitud de $475.000 + 5 % con total $498.750 y reintento sin duplicado.
- Rechazo de completar una solicitud pendiente o valorarla antes de completar.
- Aceptación, finalización y valoración.
- Cambio de tarifa conserva las operaciones existentes y rechaza una cotización antigua.
- Crear, editar y pausar publicaciones; impedir solicitudes de una publicación pausada.
- Lectura posterior confirma que solicitudes y favoritos sobreviven a nuevas consultas.

La instalación física en Android/iOS y la navegación offline real deben comprobarse en los dispositivos del piloto. El resultado actual incluye los componentes PWA necesarios y una página offline específica.

## Siguiente incremento para usuarios reales

Separar estudiante/prestador/administrador con autorización del servidor y asignar solicitudes al prestador correcto entre cuentas; añadir gestión de usuarios, verificación de oferta y fotografía real, calendario e inventario, políticas comerciales y tratamiento de datos, y una pasarela en ambiente de pruebas antes de habilitar cobros. La tarifa se decide después de medir conversión y disposición de pago en el piloto.

Referencias técnicas: [Instalación de PWA, MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [Service Worker API, MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API).
