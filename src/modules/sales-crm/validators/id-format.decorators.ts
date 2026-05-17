import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator'
import {
  W24_CASE_ID_REGEX,
  W24_CUSTOMER_ID_REGEX,
  W24_LEAD_ID_REGEX,
  W24_QUOTATION_REF_REGEX,
} from '../types/sales-crm.types'

function buildIdFormatDecorator(
  name: string,
  regex: RegExp,
  message: string,
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name,
      target: object.constructor,
      propertyName,
      options: {
        message,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && regex.test(value)
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} ${message}`
        },
      },
    })
  }
}

export function IsW24CustomerId(validationOptions?: ValidationOptions) {
  return buildIdFormatDecorator(
    'isW24CustomerId',
    W24_CUSTOMER_ID_REGEX,
    'must match W24-CUST-XXXXX format',
    validationOptions,
  )
}

export function IsW24CaseId(validationOptions?: ValidationOptions) {
  return buildIdFormatDecorator(
    'isW24CaseId',
    W24_CASE_ID_REGEX,
    'must match W24-CASE-XXXXX format',
    validationOptions,
  )
}

export function IsW24LeadId(validationOptions?: ValidationOptions) {
  return buildIdFormatDecorator(
    'isW24LeadId',
    W24_LEAD_ID_REGEX,
    'must match W24-LEAD-XXXXX format',
    validationOptions,
  )
}

export function IsW24QuotationReference(validationOptions?: ValidationOptions) {
  return buildIdFormatDecorator(
    'isW24QuotationReference',
    W24_QUOTATION_REF_REGEX,
    'must match W24-QUOT-XXXXX format',
    validationOptions,
  )
}
