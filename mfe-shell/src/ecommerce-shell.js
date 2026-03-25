import { registerApplication, start, navigateToUrl } from "single-spa";
import React from "react";
import ReactDOM from "react-dom";

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  
  React.useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);
  
  if (hasError) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Module unavailable</div>;
  }
  return children;
};

function Navbar() {
  const [activeRoute, setActiveRoute] = React.useState(window.location.pathname);
  const [cartCount, setCartCount] = React.useState(() => {
    const cart = JSON.parse(localStorage.getItem('ecommerce-cart') || '[]');
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  });

  React.useEffect(() => {
    const handleLocationChange = () => setActiveRoute(window.location.pathname);
    window.addEventListener("popstate", handleLocationChange);
    
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('ecommerce-cart') || '[]');
      setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    };
    
    window.addEventListener("cart:updated", updateCartCount);
    window.addEventListener("storage", updateCartCount);
    
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("cart:updated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  const navigateTo = (path) => {
    navigateToUrl(path);
    setActiveRoute(path);
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.logo} onClick={() => navigateTo("/")}>
        Mini E-commerce
      </div>
      <ul style={styles.navLinks}>
        <li>
          <a href="#" onClick={(e) => { e.preventDefault(); navigateTo("/catalog"); }}
            style={{...styles.navLink, ...(activeRoute.startsWith("/catalog") ? styles.navLinkActive : {})}}>
            Catálogo
          </a>
        </li>
        <li>
          <a href="#" onClick={(e) => { e.preventDefault(); navigateTo("/checkout"); }}
            style={{...styles.navLink, ...(activeRoute.startsWith("/checkout") ? styles.navLinkActive : {})}}>
            Carrito ({cartCount})
          </a>
        </li>
      </ul>
    </nav>
  );
}

const styles = {
  navbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 2rem", backgroundColor: "#2c3e50", color: "white" },
  logo: { fontSize: "1.5rem", fontWeight: "bold", cursor: "pointer", color: "white" },
  navLinks: { display: "flex", listStyle: "none", gap: "1.5rem", margin: 0, padding: 0 },
  navLink: { color: "rgba(255,255,255,0.7)", textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "4px" },
  navLinkActive: { color: "white", backgroundColor: "rgba(255,255,255,0.1)" },
};

registerApplication({ 
  name: "@ecommerce/navbar", 
  app: { 
    bootstrap: async () => {},
    mount: async () => {
      const navbarContainer = document.querySelector("#navbar-container");
      ReactDOM.render(<ErrorBoundary><Navbar /></ErrorBoundary>, navbarContainer);
    },
    unmount: async () => {
      const navbarContainer = document.querySelector("#navbar-container");
      ReactDOM.unmountComponentAtNode(navbarContainer);
    },
  }, 
  activeWhen: "/"
});

registerApplication({
  name: "@ecommerce/catalog",
  app: () => import("@ecommerce/catalog"),
  activeWhen: ["/catalog"],
  customProps: { domElementGetter: () => document.querySelector("#app-container") }
});

registerApplication({
  name: "@ecommerce/checkout",
  app: () => import("@ecommerce/checkout"),
  activeWhen: ["/checkout"],
  customProps: { domElementGetter: () => document.querySelector("#app-container") }
});

navigateToUrl(window.location.pathname);
start();
