const { mergeWithCustomize, unique } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "ecommerce",
    projectName: "shell",
    webpackConfigEnv,
    argv,
    disableHtmlGeneration: true,
    outputSystemJS: true,
  });

  return mergeWithCustomize({
    customizeArray: unique("plugins", ["HtmlWebpackPlugin"], (plugin) =>
      plugin.constructor.es6Module ? plugin.constructor.name : plugin.constructor
    ),
  })(
    {
      entry: {
        main: "./src/ecommerce-shell.js",
      },
      plugins: [
        new HtmlWebpackPlugin({
          inject: false,
          template: "src/index.ejs",
          templateParameters: {
            isLocal: webpackConfigEnv && webpackConfigEnv.isLocal,
          },
        }),
      ],
    },
    defaultConfig
  );
};
