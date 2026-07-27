import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fun.empiregold',
  appName: 'Empire Gold',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
