import { assertValidConstraintAnswer } from '../constraint';

describe('assertValidConstraintAnswer', () => {
  it('throws when status is Set and value is absent', () => {
    expect(() => assertValidConstraintAnswer('Set', null)).toThrow();
    expect(() => assertValidConstraintAnswer('Set', undefined)).toThrow();
  });

  it('throws when status is Unknown and a value is present', () => {
    expect(() => assertValidConstraintAnswer('Unknown', '15-30')).toThrow();
  });

  it('throws when status is None and a value is present', () => {
    expect(() => assertValidConstraintAnswer('None', 'Solo')).toThrow();
  });

  it('accepts a valid Set answer with a matching value', () => {
    expect(() => assertValidConstraintAnswer('Set', '15-30')).not.toThrow();
  });

  it('accepts a valid Unknown answer with no value', () => {
    expect(() => assertValidConstraintAnswer('Unknown', null)).not.toThrow();
  });

  it('accepts a valid None answer with no value', () => {
    expect(() => assertValidConstraintAnswer('None', null)).not.toThrow();
  });
});
