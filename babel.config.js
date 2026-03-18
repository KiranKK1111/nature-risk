const plugins = [];
if (process.env.HOT_RELOAD === "yes") {
    plugins.push("react-refresh/babel")
}

module.exports = {
    presets: [["@babel/preset-env", { "useBuiltIns": "usage", "corejs": 3 }], ["@babel/preset-react", { runtime: "automatic" }], "@babel/preset-typescript"],
    plugins: plugins
}