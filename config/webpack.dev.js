const { merge } = require("webpack-merge");
const path = require("path");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const ESLintPlugin = require("eslint-webpack-plugin");
const commonConfig = require("./webpack.common");
const packageJson = require("../package.json").dependencies;

const mockServer = "http://localhost:6002";
const applicationServer =
  "http://esg-nature-risk-map-backend-esg-sa-09.apps.colt-np.ocp.dev.net";
const localPythonBackend = "http://localhost:8000";

const devConfig = {
  mode: "development",
  entry: {
    app: "./src/index",
  },
  output: {
    filename: "[name].[contenthash].js",
    path: path.resolve(__dirname, "../build"),
    assetModuleFilename: "assets/[contenthash][ext]",
    publicPath: "http://localhost:3011/",
    clean: true,
  },
  plugins: [
    new ReactRefreshWebpackPlugin(),
    new ESLintPlugin(),
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
  devtool: "source-map",
  devServer: {
    static: [
      {
        directory: path.resolve(__dirname, "../build"),
      },
      {
        directory: path.resolve(__dirname, "../public"),
        publicPath: "/",
      },
    ],
    port: 3011 || "auto",
    hot: true,
    open: true,
    historyApiFallback: true,
    allowedHosts: "all",
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    client: {
      overlay: {
        errors: false,
        warnings: false,
      },
      progress: true,
    },
    proxy: [
      {
        context: ["/esg/naturerisk"],
        target: localPythonBackend,
        pathRewrite: { "^/esg/naturerisk": "" },
        changeOrigin: true,
        logLevel: "debug",
        onProxyReq: function(proxyReq, req, res) {
          console.log('[Proxy]', req.method, req.url, '→', localPythonBackend + req.url.replace('/esg/naturerisk', ''));
        },
      },
    ],
  },
};

module.exports = merge(commonConfig, devConfig);
