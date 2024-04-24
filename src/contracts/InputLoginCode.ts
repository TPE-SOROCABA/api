import { IsString, Length } from "class-validator";
import { BaseValidate } from "../shared/BaseValidate";

export class InputLoginCode extends BaseValidate {
  @Length(11, 11, { message: "A propriedade 'phone' deve ter entre 11 caracteres" })
  @IsString({ message: "A propriedade 'phone' deve ser uma string" })
  phone: string;


  @Length(6, 6, { message: "A propriedade 'code' deve ter 6 caracteres" })
  @IsString({ message: "A propriedade 'code' deve ser uma string" })
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
