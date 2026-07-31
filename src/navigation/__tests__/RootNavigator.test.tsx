import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Children, isValidElement, type ReactElement } from 'react';

import RootNavigator from '../RootNavigator';

type ScreenElement = ReactElement<{
  name: string;
  options?:
    | NativeStackNavigationOptions
    | ((props: { navigation: unknown }) => NativeStackNavigationOptions);
}>;

const NAVIGATION = {
  reset: jest.fn(),
  goBack: jest.fn(),
  canGoBack: () => true,
};

function screens(): ScreenElement[] {
  const container = RootNavigator() as ReactElement<{ children: ReactElement }>;
  const navigator = container.props.children as ReactElement<{
    screenOptions: NativeStackNavigationOptions;
    children: ReactElement;
  }>;

  return Children.toArray(navigator.props.children).filter(isValidElement) as ScreenElement[];
}

function navigatorScreenOptions(): NativeStackNavigationOptions {
  const container = RootNavigator() as ReactElement<{ children: ReactElement }>;
  const navigator = container.props.children as ReactElement<{
    screenOptions: NativeStackNavigationOptions;
  }>;

  return navigator.props.screenOptions;
}

function resolveOptions(screen: ScreenElement): NativeStackNavigationOptions {
  const { options } = screen.props;
  const own = typeof options === 'function' ? options({ navigation: NAVIGATION }) : (options ?? {});

  return { ...navigatorScreenOptions(), ...own };
}

describe('RootNavigator header configuration', () => {
  it('registers every route in the param list', () => {
    expect(screens().map((screen) => screen.props.name)).toEqual([
      'InterestList',
      'CreateInterest',
      'InterestDetail',
      'NoteJournal',
      'EditInterest',
      'GuidedSetup',
    ]);
  });

  it('centers the title on every screen', () => {
    for (const screen of screens()) {
      expect(resolveOptions(screen).headerTitleAlign).toBe('center');
    }
  });

  it('gives every screen below the root the Back and Home header controls', () => {
    for (const screen of screens()) {
      const options = resolveOptions(screen);
      if (screen.props.name === 'InterestList') {
        expect(options.headerLeft).toBeUndefined();
      } else {
        expect(options.headerLeft).toBeDefined();
      }
    }
  });

  it('titles the Edit screen "Edit", not "Edit Interest"', () => {
    const edit = screens().find((screen) => screen.props.name === 'EditInterest')!;

    expect(resolveOptions(edit).title).toBe('Edit');
  });
});
