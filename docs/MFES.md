# Microfrontends (MFEs)

## Visión General

Este proyecto usa **single-spa** para orquestar microfrontends. A diferencia de Module Federation (originalmente planificado), single-spa permite cargar aplicaciones de forma dinámica según la ruta del navegador.

## Arquitectura single-spa

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER                                  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   mfe-shell                           │   │
│  │   (Puerto 9000 - Root Config)                        │   │
│  │                                                      │   │
│  │   - Registra todas las aplicaciones                  │   │
│  │   - Controla navegación                              │   │
│  │   - Navbar con contador del carrito                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│        ┌─────────────────────┼─────────────────────┐       │
│        │                     │                     │       │
│        ▼                     ▼                     ▼       │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐   │
│  │ catalog  │         │ checkout │         │ (future) │   │
│  │ :8501   │         │ :8502   │         │ :8503   │   │
│  └──────────┘         └──────────┘         └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Estructura de MFEs

### mfe-shell (Root Config)
```
mfe-shell/
├── package.json
├── webpack.config.js
└── src/
    └── ecommerce-shell.js    # Registro de aplicaciones
```

### catalog (MFE)
```
catalog/
├── package.json
├── webpack.config.js
├── babel.config.js
└── src/
    ├── set-public-path.js
    ├── root.component.jsx
    ├── ecommerce-catalog.jsx    # Entry point
    ├── EcommerceCatalog.jsx     # Componente principal
    └── App.css
```

## Configuración de webpack

### webpack.config.js del MFE
```javascript
const { mergeWithCustomize, unique } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react");

module.exports = (webpackConfigEnv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "ecommerce",
    projectName: "catalog",
    webpackConfigEnv,
    outputSystemJS: true,
  });

  return mergeWithCustomize({
    customizeArray: unique("plugins", ["HtmlWebpackPlugin"], (plugin) =>
      plugin.constructor.es6Module ? plugin.constructor.name : plugin.constructor
    ),
  })(
    {
      entry: {
        "ecommerce-catalog": "./src/ecommerce-catalog.jsx",
      },
      devServer: {
        port: 8501,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        historyApiFallback: true,
      },
      externals: ["react", "react-dom"],
    },
    defaultConfig
  );
};
```

**Puntos clave:**
- `outputSystemJS: true` - Genera bundle compatible con SystemJS
- `port: 8501` - Puerto único por MFE
- `externals: ["react", "react-dom"]` - React viene del shell

## Registro en Shell

```javascript
// mfe-shell/src/ecommerce-shell.js

// MFE embebido (navbar)
registerApplication({ 
  name: "@ecommerce/navbar", 
  app: { 
    bootstrap: async () => {},
    mount: async () => {
      ReactDOM.render(<Navbar />, document.querySelector("#navbar-container"));
    },
    unmount: async () => {
      ReactDOM.unmountComponentAtNode(document.querySelector("#navbar-container"));
    },
  }, 
  activeWhen: "/"
});

// MFE externo (catalog)
registerApplication({
  name: "@ecommerce/catalog",
  app: () => import("@ecommerce/catalog"),
  activeWhen: ["/catalog"],
  customProps: { domElementGetter: () => document.querySelector("#app-container") }
});

// MFE externo (checkout)
registerApplication({
  name: "@ecommerce/checkout",
  app: () => import("@ecommerce/checkout"),
  activeWhen: ["/checkout"],
  customProps: { domElementGetter: () => document.querySelector("#app-container") }
});

start();
```

## Ciclo de Vida (Lifecycle Hooks)

Cada MFE debe exportar:

```javascript
// catalog/src/ecommerce-catalog.jsx
import singleSpaReact from "single-spa-react";
import Root from "./root.component";

const lifecycles = singleSpaReact({
  React,
  ReactDOM,
  rootComponent: Root,
  errorBoundary(err, info, props) {
    return <div>Error loading module</div>;
  },
});

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
```

| Hook | Cuándo se ejecuta |
|------|-------------------|
| bootstrap | Primera vez que se carga |
| mount | Cuando la ruta activa el MFE |
| unmount | Cuando se sale de la ruta del MFE |

## Comunicación entre MFEs

### Carrito Compartido (localStorage)

```javascript
// Agregar al carrito (catalog MFE)
const addToCart = (product) => {
  const cart = JSON.parse(localStorage.getItem('ecommerce-cart') || '[]');
  cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1 });
  localStorage.setItem('ecommerce-cart', JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('cart:updated'));
};

// Escuchar cambios (navbar en mfe-shell)
useEffect(() => {
  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('ecommerce-cart') || '[]');
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
  };
  
  window.addEventListener("cart:updated", updateCartCount);
  window.addEventListener("storage", updateCartCount);
  
  return () => {
    window.removeEventListener("cart:updated", updateCartCount);
    window.removeEventListener("storage", updateCartCount);
  };
}, []);
```

## Agregar un Nuevo MFE

1. **Crear estructura:**
```bash
mkdir nuevo-mfe
cd nuevo-mfe
npm init -y
npm install react react-dom single-spa single-spa-react
npm install -D webpack webpack-cli webpack-dev-server ...
```

2. **Configurar webpack** con puerto único (ej: 8503)

3. **Registrar en mfe-shell:**
```javascript
registerApplication({
  name: "@ecommerce/nuevo-mfe",
  app: () => import("@ecommerce/nuevo-mfe"),
  activeWhen: ["/nueva-ruta"],
});
```

## Comandos

```bash
# Desarrollo
cd mfe-shell && npm start        # Puerto 9000
cd catalog && npm start          # Puerto 8501
cd checkout && npm start          # Puerto 8502

# Build producción
npm run build
```

## Errores Comunes

### "Module not found"
- Verificar que el entry point se llame `{orgName}-{projectName}.jsx`

### "Cannot find module 'react'"
- Agregar React a externals en webpack.config.js

### MFE no carga
- Verificar que el MFE esté ejecutándose en su puerto
- Revisar import map en mfe-shell
