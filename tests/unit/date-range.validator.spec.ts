import { IsEndDateAfterStartDateConstraint } from '../../src/common/validators/date-range.validator';

describe('IsEndDateAfterStartDateConstraint', () => {
  let validator: IsEndDateAfterStartDateConstraint;

  beforeEach(() => {
    validator = new IsEndDateAfterStartDateConstraint();
  });

  it('should validate valid date range', () => {
    const value = '2025-01-10';
    const args = { object: { startDate: '2025-01-01' } } as any;
    expect(validator.validate(value, args)).toBe(true);
  });

  it('should invalidate if endDate before startDate', () => {
    const value = '2025-01-01';
    const args = { object: { startDate: '2025-01-10' } } as any;
    expect(validator.validate(value, args)).toBe(false);
  });

  it('should validate if missing startDate', () => {
    const value = '2025-01-10';
    const args = { object: {} } as any;
    expect(validator.validate(value, args)).toBe(true);
  });

  it('should validate if missing endDate', () => {
    const value = undefined;
    const args = { object: { startDate: '2025-01-01' } } as any;
    expect(validator.validate(value, args)).toBe(true);
  });
}); 