import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stagelink.app',
  appName: 'StageLink',
  webDir: '../../dist/apps/mobile',
  server: {
    androidScheme: 'https',
  },
};

export default config;
