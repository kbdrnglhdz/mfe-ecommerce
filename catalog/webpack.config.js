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
