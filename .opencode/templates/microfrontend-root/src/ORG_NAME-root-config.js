import { registerApplication, start, navigateToUrl } from "single-spa";
import { constructRoutes, constructLayoutEngine } from "single-spa-layout";
import React from "react";
import ReactDOM from "react-dom";

const routes = constructRoutes(document.querySelector("#single-spa-layout"));
const layoutEngine = constructLayoutEngine({ routes, baseURL: window.location.origin });

const navbarApp = {
  bootstrap: async () => {
    const navbarContainer = document.querySelector("#navbar-container");
    ReactDOM.render(<Navbar />, navbarContainer);
  },
  mount: async () => {},
  unmount: async () => {
    const navbarContainer = document.querySelector("#navbar-container");
    ReactDOM.unmountComponentAtNode(navbarContainer);
  },
};

function Navbar() {
  const [activeRoute, setActiveRoute] = React.useState(window.location.pathname);

  React.useEffect(() => {
    const handleLocationChange = () => setActiveRoute(window.location.pathname);
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  const navigateTo = (path) => {
    navigateToUrl(path);
    setActiveRoute(path);
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.logo} onClick={() => navigateTo("/")}>
        ORG_NAME App
      </div>
      <ul style={styles.navLinks}>
        <li>
          <a href="#" onClick={(e) => { e.preventDefault(); navigateTo("/clientes"); }}
            style={{...styles.navLink, ...(activeRoute.startsWith("/clientes") ? styles.navLinkActive : {})}}>
            Clientes
          </a>
        </li>
        <li>
          <a href="#" onClick={(e) => { e.preventDefault(); navigateTo("/productos"); }}
            style={{...styles.navLink, ...(activeRoute.startsWith("/productos") ? styles.navLinkActive : {})}}>
            Productos
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

registerApplication({ name: "@ORG_NAME/navbar", app: navbarApp, activeWhen: "/", customProps: { domElementGetter: () => document.querySelector("#navbar-container") } });

layoutEngine.listen();
navigateToUrl(window.location.pathname);
start();
