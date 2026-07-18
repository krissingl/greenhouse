import { StatusBar } from 'expo-status-bar';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import './src/db/bootstrap';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/theme';

export default function App(): ReactElement {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
