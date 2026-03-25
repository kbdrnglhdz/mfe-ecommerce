import { Route, Switch, Link } from "react-router-dom";
import "./App.css";

const Home = () => (
  <div className="page">
    <h1>Welcome to My Microfrontend</h1>
    <p>This is a React microfrontend powered by single-spa.</p>
  </div>
);

const About = () => (
  <div className="page">
    <h1>About</h1>
    <p>Information about this microfrontend.</p>
  </div>
);

const NotFound = () => (
  <div className="page">
    <h1>404</h1>
    <p>Page not found</p>
  </div>
);

const App = ({ authToken }) => {
  return (
    <div className="app">
      <nav className="nav">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>

      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/about" component={About} />
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
