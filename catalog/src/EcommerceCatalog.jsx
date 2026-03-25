import { useState, useEffect } from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import "./App.css";

const API_URL = "http://localhost:8081/api/products";

const ProductCard = ({ product, onAddToCart }) => (
  <div className="product-card">
    <div className="product-image">
      {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : "📦"}
    </div>
    <div className="product-info">
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <div className="product-price">${product.price}</div>
      <button 
        className="add-to-cart-btn"
        onClick={() => onAddToCart(product)}
      >
        Agregar al Carrito
      </button>
    </div>
  </div>
);

const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then(res => {
        if (!res.ok) throw new Error("Error al cargar productos");
        return res.json();
      })
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching products:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleAddToCart = (product) => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      quantity: 1
    };
    
    const existingCart = JSON.parse(localStorage.getItem('ecommerce-cart') || '[]');
    const existingIndex = existingCart.findIndex(item => item.id === cartProduct.id);
    if (existingIndex >= 0) {
      existingCart[existingIndex].quantity += 1;
    } else {
      existingCart.push(cartProduct);
    }
    localStorage.setItem('ecommerce-cart', JSON.stringify(existingCart));
    
    window.dispatchEvent(new CustomEvent('cart:updated'));
    
    alert(`${product.name} agregado al carrito!`);
  };

  if (loading) return <div className="catalog"><p>Cargando productos...</p></div>;
  if (error) return <div className="catalog"><p>Error: {error}</p></div>;

  return (
    <div className="catalog">
      <h1>Catálogo de Productos</h1>
      <div className="products-grid">
        {products.map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onAddToCart={handleAddToCart} 
          />
        ))}
      </div>
    </div>
  );
};

const NotFound = () => (
  <div className="page">
    <h1>404</h1>
    <p>Página no encontrada</p>
  </div>
);

const App = ({ authToken }) => {
  return (
    <div className="app">
      <Switch>
        <Route exact path="/" component={Catalog} />
        <Route component={NotFound} />
      </Switch>

      {authToken && (
        <div className="auth-info">
          Auth token present
        </div>
      )}
    </div>
  );
};

export default App;
