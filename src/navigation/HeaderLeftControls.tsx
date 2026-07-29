import type { NavigationProp } from '@react-navigation/native';
import type { ReactElement } from 'react';

import HomeHeaderButton from './HomeHeaderButton';
import type { RootStackParamList } from './RootNavigator';

interface Props {
  navigation: NavigationProp<RootStackParamList>;
}

/**
 * Custom headerLeft content replaces the platform's default back button
 * entirely. Android hardware/gesture back still works regardless — this only
 * removes the on-screen text control, which collided with the title. Home is
 * the sole persistent affordance here.
 */
export default function HeaderLeftControls({ navigation }: Props): ReactElement {
  return <HomeHeaderButton navigation={navigation} />;
}
