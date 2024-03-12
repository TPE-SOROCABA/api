import { IsNotEmpty, IsString, Length } from "class-validator";
import { BaseValidate } from "../shared/BaseValidate";

export class LoginCodeParams extends BaseValidate {
  @Length(1, 11, { message: "A propriedade 'cpf' deve ter entre 1 e 11 caracteres" })
  @IsString({ message: "A propriedade 'cpf' deve ser uma string" })
  cpf: string;


  @Length(6, 6, { message: "A propriedade 'code' deve ter 6 caracteres" })
  @IsString({ message: "A propriedade 'code' deve ser uma string" })
  code: string;
 
  private constructor(cpf: string, code: string) {
    super();
    this.cpf = cpf;
    this.code = code;
  }

  static async create(cpf: string, code: string): Promise<LoginCodeParams> {
    const params = new LoginCodeParams(cpf, code);
    await LoginCodeParams.validate(params);
    return params;
  }
}
