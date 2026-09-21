const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web") {
    if (
      moduleName === "react-native-maps" ||
      moduleName === "react-native-maps-directions"
    ) {
      return {
        filePath: path.resolve(__dirname, "mocks/react-native-maps.js"),
        type: "sourceFile",
      };
    }
    if (moduleName === "@stripe/stripe-react-native") {
      return {
        filePath: path.resolve(__dirname, "mocks/stripe-react-native.js"),
        type: "sourceFile",
      };
    }
    if (moduleName.startsWith("react-native/Libraries/")) {
      return {
        filePath: path.resolve(
          __dirname,
          "node_modules/react-native-web/dist/index.js"
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
