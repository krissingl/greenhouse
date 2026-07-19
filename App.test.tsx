import { render } from '@testing-library/react-native';

import App from './App';

describe('App', () => {
  it('renders the app shell (navigation + theme provider) without crashing', async () => {
    const { findByText } = await render(<App />);
    expect(await findByText('No interests yet')).toBeTruthy();
  });
});
