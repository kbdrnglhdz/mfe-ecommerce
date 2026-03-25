import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";
import App from "./EcommerceCheckout.jsx";

const Root = (props) => {
  return (
    <BrowserRouter basename="/checkout">
      <App {...props} />
    </BrowserRouter>
  );
};

export default Root;
