import { assertValidTitle, validateTitle } from '../interest';

describe('validateTitle', () => {
  it('rejects an empty title', () => {
    expect(validateTitle('')).toBe(false);
  });

  it('rejects a whitespace-only title', () => {
    expect(validateTitle('   ')).toBe(false);
  });

  it('accepts a valid non-empty title', () => {
    expect(validateTitle('Learn violin')).toBe(true);
  });

  it('accepts a title with surrounding whitespace', () => {
    expect(validateTitle('  Learn violin  ')).toBe(true);
  });
});

describe('assertValidTitle', () => {
  it('throws for an empty title', () => {
    expect(() => assertValidTitle('')).toThrow();
  });

  it('throws for a whitespace-only title', () => {
    expect(() => assertValidTitle('   ')).toThrow();
  });

  it('does not throw for a valid title', () => {
    expect(() => assertValidTitle('Learn violin')).not.toThrow();
  });
});
