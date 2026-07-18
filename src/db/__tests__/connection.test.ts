import { getDatabase } from '../connection';

describe('database connection', () => {
  it('opens the app database successfully', () => {
    expect(() => getDatabase()).not.toThrow();
    expect(getDatabase()).toBeDefined();
  });
});
