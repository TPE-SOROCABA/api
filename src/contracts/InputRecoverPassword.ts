import { IsString, Length } from "class-validator";
import { BaseValidate } from "../shared/BaseValidate";

export class InputRecoverPassword extends BaseValidate {
  @Length(11, 11, { message: "O número de telefone deve ter exatamente 11 dígitos" })
  @IsString({ message: "O número de telefone deve ser uma sequência de caracteres" })
  phone: string;
 
  private constructor(phone: string) {
    super();
    this.phone = phone;
  }

  static async create(phone: string): Promise<InputRecoverPassword> {
    const params = new InputRecoverPassword(phone);
    await InputRecoverPassword.validate(params);
    return params;
  }
}
