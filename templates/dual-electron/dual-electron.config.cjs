const path = require("node:path");

/**
 * The only integration point with a DualVite project. Keep this path relative
 * to the Electron project so moving both sibling projects remains easy.
 */
module.exports = {
  rendererDir: path.resolve(__dirname, "__RENDERER_DIR__"),
  rendererDevUrl: "__DEV_URL__",
  rendererHash: "/",
};
