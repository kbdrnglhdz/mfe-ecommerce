import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";
import App from "./App";

const Root = (props) => {
  return (
    <BrowserRouter basename="/mi-microfrontend">
      <App {...props} />
    </BrowserRouter>
  );
};

export default Root;
