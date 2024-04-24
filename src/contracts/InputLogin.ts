import { IsString, Length } from "class-validator";
import { BaseValidate } from "../shared/BaseValidate";

export class InputLogin extends BaseValidate { // 15981217448
  @Length(11, 11, { message: "A propriedade 'phone' deve ter entre 11 caracteres" })
  @IsString({ message: "A propriedade 'phone' deve ser uma string" })
  phone: string;

  @Length(6, 16, { message: "A propriedade 'password' deve ter entre 1 e 16 caracteres" })
  @IsString({ message: "A propriedade 'password' deve ser uma string" })
  password: string;

 
  private constructor(phone: string, password: string) {
    super();
    this.phone = phone;
    this.password = password;
  }

  static async create(phone: string, password: string,): Promise<InputLogin> {
    const params = new InputLogin(phone, password);
    await InputLogin.validate(params);
    return params;
  }
}
