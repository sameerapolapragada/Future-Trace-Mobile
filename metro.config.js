const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Avoid package.json "exports" resolving to untranspiled ESM (Hermes can't parse #private fields).
config.resolver.unstable_enablePackageExports = false;

config.watchFolders = [path.resolve(projectRoot, "lib")];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")];

module.exports = config;
