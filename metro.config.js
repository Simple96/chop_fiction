const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 添加 web 平台支持
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// 解决 React Native Web 的模块解析问题
config.resolver.alias = {
  'react-native': 'react-native-web',
};

module.exports = config; 