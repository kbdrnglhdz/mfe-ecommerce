---
name: microfrontends
description: Skill para crear y gestionar microfrontends usando single-spa con arquitectura políglota. Incluye templates para root-config y microfrontends React, configuración de webpack, SystemJS, import maps, y troubleshooting de errores comunes.
---

# Microfrontends con single-spa

## Descripción

Esta skill proporciona instrucciones especializadas para crear y gestionar microfrontends usando **single-spa** con arquitectura políglota (múltiples frameworks: React, Vue, etc.).

Basado en la implementación de [polyglot-microfrontends](https://github.com/polyglot-microfrontends).

---

## Conceptos Fundamentales

### ¿Qué es single-spa?

single-spa es un framework para **microfrontends** que permite:
- Dividir el frontend en aplicaciones independientes
- Cada microfrontend puede usar un framework diferente (React, Vue, AngularJS, etc.)
- Se cargan y descargan dinámicamente según la ruta
- Todas coexisten en el mismo DOM sin conflictos

### Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ <script type="importmap">                            │    │
│  │ {                                                   │    │
│  │   "imports": {                                      │    │
│  │     "react": "https://cdn.../react.js",              │    │
│  │     "@org/navbar": "https://cdn.../navbar.js",      │    │
│  │     "@org/clients": "https://cdn.../clients.js"     │    │
│  │   }                                                  │    │
│  │ }                                                    │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │  React   │  │   Vue    │  │ Angular  │                   │
│  │    MF    │  │    MF    │  │    MF    │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Componentes Clave

| Componente | Propósito |
|------------|-----------|
| **root-config** | Orchestra todos los microfrontends, define import map |
| **import map** | Mapea nombres de módulos a URLs reales |
| **SystemJS** | Polyfill para import maps en navegadores sin soporte nativo |
| **single-spa** | Gestión de ciclos de vida de microfrontends |

---

## Inicio Rápido

### Usando setup.sh

La forma más rápida de crear un nuevo microfrontend:

```bash
# Desde la raíz del proyecto
./setup.sh <nombre-proyecto> <nombre-org>

# Ejemplo:
./setup.sh clientes kbd
```

Esto creará una carpeta `clientes/` con:
- Configuración webpack lista
- Babel configurado
- Entry point correcto (`kbd-clientes.jsx`)
- Navegación y estructura de archivos

### Desarrollo

```bash
# 1. Iniciar root-config
cd root-config && npm start

# 2. En terminales separadas, iniciar cada microfrontend
cd clientes && npm start      # Puerto 8500
cd productos && npm start    # Puerto 8501

# 3. Abrir http://localhost:9000
```

---

## Lifecycle Hooks

Cada microfrontend debe exportar 3 funciones:

| Hook | Cuándo se ejecuta |
|------|-------------------|
| **bootstrap** | Una vez cuando se carga por primera vez |
| **mount** | Cuando la ruta activa el microfrontend |
| **unmount** | Cuando se sale de la ruta del microfrontend |

```javascript
export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
```

---

## Estructura de Archivos

### Root Config

```
root-config/
├── package.json
├── webpack.config.js
└── src/
    ├── index.ejs              # HTML con import map
    └── ORG_NAME-root-config.js  # Registro de aplicaciones
```

### Microfrontend React

```
mi-microfrontend/
├── package.json
├── webpack.config.js
├── babel.config.js
└── src/
    ├── ORG_NAME-proyecto.jsx    # Entry point (requerido)
    ├── App.jsx                  # Componente principal
    ├── root.component.jsx       # Root component
    └── set-public-path.js       # SystemJS path setup
```

---

## Configuración Requerida

### webpack.config.js del Microfrontend

```javascript
const singleSpaDefaults = require("webpack-config-single-spa-react");

module.exports = (webpackConfigEnv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "kbd",
    projectName: "mi-proyecto",
    webpackConfigEnv,
    outputSystemJS: true,  // IMPORTANTE: Required para SystemJS
  });

  return mergeWithCustomize({...})(
    {
      devServer: {
        port: 8500,
        headers: { "Access-Control-Allow-Origin": "*" },
        historyApiFallback: true,
      },
      externals: ["react", "react-dom"],
    },
    defaultConfig
  );
};
```

### set-public-path.js

```javascript
import { setPublicPath } from "systemjs-webpack-interop";

// rootDirectoryLevel: 1 = archivo en raíz del servidor
setPublicPath("@kbd/mi-proyecto", 1);
```

### Import Map (index.ejs del root-config)

```html
<script type="systemjs-importmap">
  {
    "imports": {
      "react": "https://cdn.jsdelivr.net/npm/react@17.0.2/umd/react.production.min.js",
      "react-dom": "https://cdn.jsdelivr.net/npm/react-dom@17.0.2/umd/react-dom.production.min.js",
      "single-spa": "https://cdn.jsdelivr.net/npm/single-spa@5.9.3/lib/system/single-spa.min.js",
      <% if (isLocal) { %>
      "@kbd/mi-proyecto": "//localhost:8500/kbd-mi-proyecto.js"
      <% } else { %>
      "@kbd/mi-proyecto": "https://cdn.example.com/mi-proyecto/latest/kbd-mi-proyecto.js"
      <% } %>
    }
  }
</script>
```

---

## Registrar en Root Config

### root-config.js

```javascript
import { registerApplication, start, navigateToUrl } from "single-spa";
import React from "react";
import ReactDOM from "react-dom";

const navbarApp = {
  bootstrap: async () => {},
  mount: async () => {
    const container = document.querySelector("#navbar-container");
    ReactDOM.render(<Navbar />, container);
  },
  unmount: async () => {
    const container = document.querySelector("#navbar-container");
    ReactDOM.unmountComponentAtNode(container);
  },
};

registerApplication({ name: "@kbd/navbar", app: navbarApp, activeWhen: "/" });

registerApplication({
  name: "@kbd/mi-proyecto",
  app: () => import("@kbd/mi-proyecto"),
  activeWhen: ["/mi-ruta"],
});

navigateToUrl(window.location.pathname);
start();
```

---

## Deployment

### Build

```bash
npm run build
# Genera: dist/kbd-mi-proyecto.js
```

### Subir a CDN

```bash
# Ejemplo con gsutil
gsutil cp -r dist/* gs://mi-bucket/mi-proyecto/v1.0.0/
```

---

## Troubleshooting

### Error: "Cannot find module 'webpack-config-single-spa-react-jsx'"

**Causa:** El paquete no existe.

**Solución:** Usar solo `webpack-config-single-spa-react` en webpack.config.js.

---

### Error: "Cannot use import statement outside a module"

**Causa:** El bundle se genera como ES module pero se carga como script.

**Solución:** Agregar `outputSystemJS: true` en la configuración de single-spa:

```javascript
const defaultConfig = singleSpaDefaults({
  orgName: "kbd",
  projectName: "mi-proyecto",
  webpackConfigEnv,
  outputSystemJS: true,
});
```

---

### Error: "Unable to resolve bare specifier 'react'"

**Causa:** React no está en el import map.

**Solución:** Agregar React al import map en index.ejs:

```html
"react": "https://cdn.jsdelivr.net/npm/react@17.0.2/umd/react.production.min.js",
"react-dom": "https://cdn.jsdelivr.net/npm/react-dom@17.0.2/umd/react-dom.production.min.js",
```

---

### Error: "rootDirectoryLevel (2) is greater than the number of directories"

**Causa:** El archivo JS está en la raíz del servidor pero se indica nivel 2.

**Solución:** Usar `rootDirectoryLevel: 1` en set-public-path.js:

```javascript
setPublicPath("@kbd/mi-proyecto", 1);
```

---

### Error: "Support for the experimental syntax 'jsx' isn't currently enabled"

**Causa:** Falta configuración de Babel.

**Solución:** Crear babel.config.js:

```javascript
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { browsers: ["last 2 versions"] } }],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
};
```

---

### Error: "Can't resolve 'kbd-proyecto'" (Module not found)

**Causa:** El entry point no tiene el nombre correcto.

**Solución:** El entry point debe llamarse `{orgName}-{projectName}.jsx`, por ejemplo:
- `@kbd/clientes` → `kbd-clientes.jsx`
- `@kbd/productos` → `kbd-productos.jsx`

---

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Iniciar servidor de desarrollo |
| `npm run build` | Generar bundle de producción |
| `npm run lint` | Ejecutar ESLint |
| `npm test` | Ejecutar tests con Jest |

---

## Templates Disponibles

Para crear un nuevo proyecto rápidamente:

1. **Root Config**: Usar `templates/microfrontend-root/`
2. **Microfrontend React**: Usar `templates/microfrontend-react/`
3. **Script setup**: Usar `./setup.sh <nombre> <org>`

```bash
# Crear nuevo microfrontend
./setup.sh mi-proyecto kbd

# Crear root-config
cp -r templates/microfrontend-root root-config
```
