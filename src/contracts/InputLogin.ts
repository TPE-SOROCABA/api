import { IsString, Length } from "class-validator";
import { BaseValidate } from "../shared/BaseValidate";

export class InputLogin extends BaseValidate { // 15981217448
  @Length(11, 11, { message: "O número de telefone deve ter 11 dígitos" })
  @IsString({ message: "O número de telefone deve ser uma sequência de números" })
  phone: string;
  
  @Length(6, 16, { message: "A senha deve ter entre 6 e 16 caracteres" })
  @IsString({ message: "A senha deve ser uma sequência de caracteres" })
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
