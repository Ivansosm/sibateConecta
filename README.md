# SIBATÉ Conecta — MVP PWA

Aplicación de prueba para explorar hospedaje y alimentación en Sibaté. Incluye catálogo, filtros, favoritos, solicitudes con desglose en COP, panel del prestador, valoraciones y administración de tarifa. Iniciativa independiente, sin vinculación institucional con la ESJIM.

## GitHub Pages

La demostración estática guarda los datos solo en el navegador. Usa nombres de prueba. No envía solicitudes a prestadores reales, no procesa pagos y no comparte información entre dispositivos o cuentas.

Para publicarla: **Settings → Pages → Source: GitHub Actions**, luego **Actions → Publicar demostración PWA → Run workflow**. La dirección publicada aparece en el entorno `github-pages` cuando el despliegue termina correctamente.

```sh
npm ci --no-audit --no-fund
npm run test:demo
npm run build:pages
npm run preview:pages
```

Abre la URL de Vite con `/sibateConecta/`. El workflow ajusta automáticamente el prefijo del repositorio. Las seis ofertas y las imágenes son ilustrativas. Tarifa inicial configurable: 5 %. Las solicitudes conservan el precio y la tarifa originales.

## Código completo

El repositorio también incluye la API, las migraciones y el piloto privado para Workers/D1 bajo Sites. GitHub Pages solo aloja la demostración estática. El servidor necesita alojamiento adicional y autenticación verificada; la autenticación Sites no debe exponerse directamente fuera de su gateway.

- [Guía de publicación y pruebas](docs/GITHUB.md)
- [Alcance del servidor y siguiente incremento](docs/MVP-fullstack.md)

Requiere Node.js 22.13 o posterior. No se incluyen credenciales, sesiones ni bases locales.
