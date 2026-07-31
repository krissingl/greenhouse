import type { NavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import HeaderLeftControls from './HeaderLeftControls';
import type { RootStackParamList } from './RootNavigator';

/**
 * Applied to every screen in the stack. Centering the title in the header's
 * true center is what keeps it clear of the header-left controls, so screens
 * never have to trade a control away to make room for their title.
 */
export const sharedHeaderOptions: NativeStackNavigationOptions = {
  headerTitleAlign: 'center',
  headerBackVisible: false,
};

export function headerLeftOptions(
  navigation: NavigationProp<RootStackParamList>,
): NativeStackNavigationOptions {
  return {
    headerLeft: () => <HeaderLeftControls navigation={navigation} />,
  };
}
