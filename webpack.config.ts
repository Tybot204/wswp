import { CleanWebpackPlugin } from "clean-webpack-plugin";
import { resolve } from "path";
import webpack from "webpack";
import nodeExternals from "webpack-node-externals";

const config: webpack.Configuration = {
  devtool: "source-map",
  entry: { bundle: "./src/index.ts" },
  externals: [nodeExternals()],
  mode:
    (process.env.NODE_ENV as webpack.Configuration["mode"]) || "development",
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.ts$/,
        use: "ts-loader",
      },
    ],
  },
  optimization: { minimize: false },
  output: {
    filename: "[name].js",
    libraryTarget: "umd",
    path: resolve(__dirname, "build"),
  },
  plugins: [new CleanWebpackPlugin()],
  resolve: {
    // NOTE: Order matters here. When duplicate filenames exist, the first matching extension imports.
    extensions: [".mjs", ".js", ".ts"],
  },
  target: "node",
};

export default config;
