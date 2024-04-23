import { IsString, Length } from "class-validator";
import { BaseValidate } from "../shared/BaseValidate";

export class InputRecoverPassword extends BaseValidate {
  @Length(1, 11, { message: "A propriedade 'cpf' deve ter entre 1 e 11 caracteres" })
  @IsString({ message: "A propriedade 'cpf' deve ser uma string" })
  cpf: string;
 
  private constructor(cpf: string) {
    super();
    this.cpf = cpf;
  }

  static async create(cpf: string): Promise<InputRecoverPassword> {
    const params = new InputRecoverPassword(cpf);
    await InputRecoverPassword.validate(params);
    return params;
  }
}
