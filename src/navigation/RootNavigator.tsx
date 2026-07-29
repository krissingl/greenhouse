import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ReactElement } from 'react';

import HeaderLeftControls from './HeaderLeftControls';
import CreateInterestScreen from '../screens/CreateInterestScreen';
import EditInterestScreen from '../screens/EditInterestScreen';
import type { EnrichmentAxis } from '../screens/enrichmentQuestions';
import GuidedSetupScreen from '../screens/GuidedSetupScreen';
import InterestDetailScreen from '../screens/InterestDetailScreen';
import InterestListScreen from '../screens/InterestListScreen';

export type RootStackParamList = {
  InterestList: undefined;
  CreateInterest: undefined;
  InterestDetail: { interestId: string };
  EditInterest: { interestId: string };
  GuidedSetup: { interestId: string; startDimension?: EnrichmentAxis };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator(): ReactElement {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="InterestList">
        <Stack.Screen
          name="InterestList"
          component={InterestListScreen}
          options={{ title: 'Home' }}
        />
        <Stack.Screen
          name="CreateInterest"
          component={CreateInterestScreen}
          options={({ navigation }) => ({
            title: 'New Interest',
            headerLeft: () => <HeaderLeftControls navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="InterestDetail"
          component={InterestDetailScreen}
          options={({ navigation }) => ({
            title: 'Interest',
            headerLeft: () => <HeaderLeftControls navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="EditInterest"
          component={EditInterestScreen}
          options={({ navigation }) => ({
            title: 'Edit Interest',
            headerLeft: () => <HeaderLeftControls navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="GuidedSetup"
          component={GuidedSetupScreen}
          options={({ navigation }) => ({
            title: 'A few more details',
            headerLeft: () => <HeaderLeftControls navigation={navigation} />,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
