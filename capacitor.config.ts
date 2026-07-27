import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fun.playnpayday',
  appName: "Play 'n Payday",
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
