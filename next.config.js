const { withExpo } = require('@expo/next-adapter');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    'react-native',
    'expo',
    'react-native-web',
    'expo-linking',
    'expo-constants',
    'expo-modules-core',
    'expo-status-bar',
    'expo-linear-gradient',
    '@expo/vector-icons',
    'react-native-safe-area-context',
  ],
};

module.exports = withExpo(nextConfig); 