import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ReactElement } from 'react';

import { headerLeftOptions, sharedHeaderOptions } from './headerOptions';
import CreateInterestScreen from '../screens/CreateInterestScreen';
import EditInterestScreen from '../screens/EditInterestScreen';
import type { EnrichmentAxis } from '../screens/enrichmentQuestions';
import GuidedSetupScreen from '../screens/GuidedSetupScreen';
import InterestDetailScreen from '../screens/InterestDetailScreen';
import InterestListScreen from '../screens/InterestListScreen';
import NoteJournalScreen from '../screens/NoteJournalScreen';

export type RootStackParamList = {
  InterestList: undefined;
  CreateInterest: undefined;
  InterestDetail: { interestId: string };
  EditInterest: { interestId: string };
  GuidedSetup: { interestId: string; startDimension?: EnrichmentAxis };
  NoteJournal: { interestId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator(): ReactElement {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="InterestList" screenOptions={sharedHeaderOptions}>
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
            ...headerLeftOptions(navigation),
          })}
        />
        <Stack.Screen
          name="InterestDetail"
          component={InterestDetailScreen}
          options={({ navigation }) => ({
            title: '',
            ...headerLeftOptions(navigation),
          })}
        />
        <Stack.Screen
          name="NoteJournal"
          component={NoteJournalScreen}
          options={({ navigation }) => ({
            title: 'Journal',
            ...headerLeftOptions(navigation),
          })}
        />
        <Stack.Screen
          name="EditInterest"
          component={EditInterestScreen}
          options={({ navigation }) => ({
            title: 'Edit',
            ...headerLeftOptions(navigation),
          })}
        />
        <Stack.Screen
          name="GuidedSetup"
          component={GuidedSetupScreen}
          options={({ navigation }) => ({
            title: 'A few more details',
            ...headerLeftOptions(navigation),
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
