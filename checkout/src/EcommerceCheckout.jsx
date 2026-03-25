import { useState, useEffect } from "react";
import { Route, Switch } from "react-router-dom";
import "./App.css";

const CartItem = ({ item, onRemove }) => (
  <div className="cart-item">
    <div className="cart-item-image">📦</div>
    <div className="cart-item-info">
      <h3>{item.name}</h3>
      <div className="cart-item-price">${item.price.toFixed(2)} x {item.quantity}</div>
    </div>
    <button className="remove-btn" onClick={() => onRemove(item.id)}>
      ×
    </button>
  </div>
);

const Cart = () => {
  const [items, setItems] = useState([]);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    const loadCart = () => {
      const cart = JSON.parse(localStorage.getItem('ecommerce-cart') || '[]');
      setItems(cart);
    };
    
    loadCart();
    
    const handleCartUpdate = () => {
      loadCart();
    };
    
    window.addEventListener('cart:updated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cart:updated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
    };
  }, []);

  const handleRemove = (productId) => {
    const updatedCart = items.filter(item => item.id !== productId);
    setItems(updatedCart);
    localStorage.setItem('ecommerce-cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new CustomEvent('cart:updated'));
  };

  const handleClearCart = () => {
    setItems([]);
    localStorage.removeItem('ecommerce-cart');
    window.dispatchEvent(new CustomEvent('cart:updated'));
  };

  const handleCheckout = () => {
    setOrderPlaced(true);
    localStorage.removeItem('ecommerce-cart');
    setItems([]);
    window.dispatchEvent(new CustomEvent('cart:updated'));
    alert('Orden procesada exitosamente! (Demo)');
  };

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (orderPlaced) {
    return (
      <div className="checkout-success">
        <div className="success-icon">✓</div>
        <h1>¡Orden Confirmada!</h1>
        <p>Gracias por tu compra. Recibirás un correo de confirmación.</p>
        <button onClick={() => { setOrderPlaced(false); setItems([]); }} className="checkout-btn">
          Seguir Comprando
        </button>
      </div>
    );
  }

  return (
    <div className="checkout">
      <h1>Carrito de Compras</h1>
      
      {items.length === 0 ? (
        <div className="empty-cart">
          <p>Tu carrito está vacío</p>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {items.map(item => (
              <CartItem 
                key={item.id} 
                item={item} 
                onRemove={handleRemove} 
              />
            ))}
          </div>
          
          <div className="cart-summary">
            <div className="total">
              <span>Total:</span>
              <span className="total-price">${total.toFixed(2)}</span>
            </div>
            <div className="cart-actions">
              <button className="clear-btn" onClick={handleClearCart}>
                Vaciar Carrito
              </button>
              <button className="checkout-btn" onClick={handleCheckout}>
                Proceder al Pago
              </button>
            </div>
          </div>
        </>
      )}
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
        <Route exact path="/" component={Cart} />
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
