# Publicación en GitHub

Este repositorio contiene el MVP completo y una demostración estática para GitHub Pages. La demostración guarda datos de prueba en el navegador. Las solicitudes no se envían a personas reales y no hay cobros, cuentas compartidas ni base de datos remota.

## Subir el repositorio

1. Crea un repositorio llamado `sibate-conecta` en tu cuenta de GitHub. Puede ser privado si solo quieres almacenar el código.
2. Descomprime el paquete de código en una carpeta y abre una terminal allí.
3. Ejecuta los comandos siguientes, sustituyendo `TU_USUARIO` por tu cuenta. Autentícate mediante el gestor de credenciales de Git; evita guardar tokens en archivos.

```sh
git init -b main
git add .
git commit -m "Entrega del MVP SIBATE-Conecta y demo PWA"
git remote add origin https://github.com/TU_USUARIO/sibate-conecta.git
git push -u origin main
```

Los comandos suponen un repositorio remoto vacío. Si lo inicializaste con README, descarga ese repositorio primero, copia el contenido del paquete dentro y haz un commit sin sobrescribir su historial.

## Publicar la demostración PWA

1. En el repositorio, abre **Settings → Pages → Build and deployment → Source → GitHub Actions**. La disponibilidad para repositorios privados depende del plan de GitHub.
2. Abre **Actions → Publicar demostración PWA → Run workflow**, selecciona `main` y ejecútalo.
3. Espera a que terminen los trabajos `build` y `deploy`. La URL comprobada aparece en el entorno `github-pages` y en el trabajo de despliegue. No des por publicada la app si algún trabajo falla.
4. Después de modificar el código, vuelve a ejecutar ese workflow. Su ejecución es manual para que la publicación sea una decisión explícita.

El workflow adapta las rutas al subdirectorio que configure GitHub Pages. El manifest, los iconos, las fotografías y el service worker usan ese mismo prefijo. No requiere secretos para Pages.

GitHub Pages aloja archivos estáticos; no ejecuta esta API ni Cloudflare D1. Usa esta demostración para validación educativa. Un servicio comercial requiere otro alojamiento y la preparación del piloto con usuarios reales.

## Probar antes de publicar

Requiere Node.js 22.13 o posterior.

```sh
npm ci --no-audit --no-fund
npx tsc --noEmit
npm run build:pages
npm run preview:pages
```

Abre la dirección que imprima Vite con el sufijo `/sibateConecta/`. Para otro nombre de repositorio, configura `PAGES_BASE_PATH` como `/NOMBRE/` al compilar. Para un dominio propio, usa `/`.

Recorrido de validación: crea un perfil de prueba, guarda una oferta, confirma una solicitud, acéptala en el panel del prestador, complétala y escribe una valoración. Cambia la tarifa y comprueba que las solicitudes anteriores conservan su desglose. Recarga para verificar la persistencia del navegador.

Para probar offline, abre la app con conexión, espera a que el service worker se active, cierra y vuelve a abrir la página; después desconecta la red y recarga. La demostración debe conservar el recorrido de prueba en el dispositivo. La instalación física en Android/iOS requiere una comprobación en esos dispositivos y HTTPS en la publicación.

Para reiniciar los datos locales, elimina la clave `sibate-conecta-demo-v1` en el almacenamiento del sitio desde las herramientas de desarrollo del navegador. No introduzcas datos personales reales.

## Servidor y base de datos

`app/api`, `db` y `drizzle` conservan la implementación del piloto privado para Cloudflare Workers/D1 dentro de Sites. Consulta [MVP-fullstack.md](./MVP-fullstack.md).

La autenticación de ese servidor depende de que Sites verifique y suministre la identidad. No despliegues el Worker directamente en una URL pública usando las cabeceras `oai-authenticated-user-*` como prueba de identidad. Antes de otro alojamiento, integra autenticación verificada, autorización entre cuentas y una base D1 configurada para ese entorno.

Este paquete no incluye una publicación automática del backend. `.openai/hosting.json` contiene la referencia del proyecto Sites original, no una credencial. El identificador D1 de una compilación local es un marcador, no una base remota lista para producción.

## Archivos excluidos

No subas `node_modules`, `dist`, `dist-pages`, `.wrangler`, `.sites-runtime`, `.vinext`, `.env`, bases locales, sesiones ni credenciales. `.gitignore` incluye estas exclusiones. En una publicación pública, revisa también cualquier archivo que agregues después.

Referencias: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [workflows de Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [límites de uso](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).
