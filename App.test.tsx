import { render } from '@testing-library/react-native';

import App from './App';

describe('App', () => {
  it('renders the app shell (navigation + theme provider) without crashing', async () => {
    const { getByText } = await render(<App />);
    expect(getByText('Greenhouse')).toBeTruthy();
  });
});
