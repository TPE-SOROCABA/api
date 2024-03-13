import { IsString, Length } from "class-validator";
import { BaseValidate } from "../shared/BaseValidate";

export class InputLogin extends BaseValidate {
  @Length(1, 11, { message: "A propriedade 'cpf' deve ter entre 1 e 11 caracteres" })
  @IsString({ message: "A propriedade 'cpf' deve ser uma string" })
  cpf: string;

  @Length(1, 16, { message: "A propriedade 'password' deve ter entre 1 e 16 caracteres" })
  @IsString({ message: "A propriedade 'password' deve ser uma string" })
  password: string;

 
  private constructor(cpf: string, password: string) {
    super();
    this.cpf = cpf;
    this.password = password;
  }

  static async create(cpf: string, password: string,): Promise<InputLogin> {
    const params = new InputLogin(cpf, password);
    await InputLogin.validate(params);
    return params;
  }
}
