const { mergeWithCustomize, unique } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react");

module.exports = (webpackConfigEnv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "ORG_NAME",
    projectName: "mi-microfrontend",
    webpackConfigEnv,
    outputSystemJS: true,
  });

  return mergeWithCustomize({
    customizeArray: unique("plugins", ["HtmlWebpackPlugin"], (plugin) =>
      plugin.constructor.es6Module ? plugin.constructor.name : plugin.constructor
    ),
  })(
    {
      devServer: {
        port: 8500,
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
