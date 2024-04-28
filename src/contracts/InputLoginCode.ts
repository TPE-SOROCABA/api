import { IsString, Length } from "class-validator";
import { BaseValidate } from "../shared/BaseValidate";

export class InputLoginCode extends BaseValidate {
  @Length(11, 11, { message: "O número de telefone deve ter exatamente 11 dígitos" })
  @IsString({ message: "O número de telefone deve ser uma sequência de caracteres" })
  phone: string;

  @Length(6, 6, { message: "O código deve ter exatamente 6 caracteres" })
  @IsString({ message: "O código deve ser uma sequência de caracteres" })
  code: string;
 
  private constructor(phone: string, code: string) {
    super();
    this.phone = phone;
    this.code = code;
  }

  static async create(phone: string, code: string): Promise<InputLoginCode> {
    const params = new InputLoginCode(phone, code);
    await InputLoginCode.validate(params);
    return params;
  }
}
