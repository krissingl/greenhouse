import { assertValidNoteBody } from '../note';

describe('assertValidNoteBody', () => {
  it('throws on an empty body', () => {
    expect(() => assertValidNoteBody('')).toThrow();
  });

  it('throws on a whitespace-only body', () => {
    expect(() => assertValidNoteBody('   ')).toThrow();
  });

  it('accepts a non-blank body', () => {
    expect(() => assertValidNoteBody('rented a violin from the shop on 5th')).not.toThrow();
  });
});
