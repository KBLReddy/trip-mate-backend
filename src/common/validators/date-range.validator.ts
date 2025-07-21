// src/common/validators/date-range.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isEndDateAfterStartDate', async: false })
export class IsEndDateAfterStartDateConstraint
  implements ValidatorConstraintInterface
{
  validate(endDate: string | Date, args: ValidationArguments): boolean {
    const obj = args.object as { startDate?: string | Date };
    const startDate = obj.startDate;
    if (!startDate || !endDate) return true;
    return new Date(endDate) > new Date(startDate);
  }

  defaultMessage(): string {
    return 'End date must be after start date';
  }
}

export function IsEndDateAfterStartDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEndDateAfterStartDateConstraint,
    });
  };
}
