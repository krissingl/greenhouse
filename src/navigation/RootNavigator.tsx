import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ReactElement } from 'react';

import InterestListScreen from '../screens/InterestListScreen';

export type RootStackParamList = {
  InterestList: undefined;
  CreateInterest: undefined;
  InterestDetail: { interestId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator(): ReactElement {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="InterestList">
        <Stack.Screen
          name="InterestList"
          component={InterestListScreen}
          options={{ title: 'Interests' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
