import type { NavigationProp } from '@react-navigation/native';
import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import BackHeaderButton from './BackHeaderButton';
import HomeHeaderButton from './HomeHeaderButton';
import type { RootStackParamList } from './RootNavigator';

interface Props {
  navigation: NavigationProp<RootStackParamList>;
}

export default function HeaderLeftControls({ navigation }: Props): ReactElement {
  return (
    <View style={styles.container}>
      {navigation.canGoBack() && <BackHeaderButton navigation={navigation} />}
      <HomeHeaderButton navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});
