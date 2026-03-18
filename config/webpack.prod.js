const { merge } = require("webpack-merge");
const path = require("path");
const commonConfig = require("./webpack.common");
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const packageJson = require("../package.json").dependencies;

const prodConfig = {
  mode: "production",
  entry: {
    app: "./src/index",
  },
  output: {
    filename: "[name].[contenthash].js",
    path: path.resolve(__dirname, "../build"),
    assetModuleFilename: "assets/[contenthash][ext]",
    publicPath: "http://localhost:8091/",
    clean: true,
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "naturerisk",
      filename: "remoteEntryNatureRisk.js",
      exposes: {
        "./NatureRiskApp": "./src/bootstrap",
      },
      shared: {
        ...packageJson,
        react: { singleton: true, eager: true, requiredVersion: "^17.0.2" },
        "react-dom": {
          singleton: true,
          eager: true,
          requiredVersion: "^17.0.2",
        },
      },
    }),
  ],
};

module.exports = merge(commonConfig, prodConfig);
