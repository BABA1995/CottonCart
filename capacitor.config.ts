import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cottoncart.app',
  appName: 'CottonCart',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  }
};

export default config;
