import { validate, ValidationError } from 'class-validator'
import { BadRequestException, Exception } from './Exception'

export abstract class BaseValidate {
  static async validate<T extends BaseValidate>(params: T): Promise<void> {
    const paramsInstance = Object.assign(new (this as any)(), params)
    const errors: ValidationError[] = await validate(paramsInstance)
    if (errors.length > 0) {
      const firstError = errors[0]
      if (!firstError.constraints) throw new BadRequestException( 'Invalid params')

      const firstErrorProperty = Object.keys(firstError.constraints)[0]
      const firstErrorMessage = firstError.constraints[firstErrorProperty]
      throw new BadRequestException( firstErrorMessage)
    }
  }
}
