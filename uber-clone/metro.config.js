const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web") {
    if (moduleName.includes("Libraries/Components/TextInput/TextInputState")) {
      return {
        filePath: path.resolve(
          __dirname,
          "node_modules/react-native-web/dist/modules/TextInputState/index.js"
        ),
        type: "sourceFile",
      };
    }
    if (
      moduleName === "../../Utilities/Platform" ||
      moduleName === "../Utilities/Platform" ||
      moduleName.endsWith("Libraries/Utilities/Platform")
    ) {
      return {
        filePath: path.resolve(
          __dirname,
          "node_modules/react-native-web/dist/exports/Platform/index.js"
        ),
        type: "sourceFile",
      };
    }
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
