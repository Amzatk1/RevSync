const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for .cjs files
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'cjs'
];

// Aggressively disable Hermes and force JSC
config.transformer = {
  ...config.transformer,
  hermesCommand: "",
  enableHermes: false,
  minifierPath: "metro-minify-terser",
};

// Override any Hermes settings
config.serializer = {
  ...config.serializer,
  customSerializer: null,
};

// Add development-specific settings to force JSC
if (process.env.NODE_ENV !== 'production') {
  config.transformer.enableHermes = false;
  config.transformer.hermesCommand = "";
}

module.exports = config;