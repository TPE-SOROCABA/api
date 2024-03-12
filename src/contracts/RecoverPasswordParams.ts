import { IsNotEmpty, IsString, Length } from "class-validator";
import { BaseValidate } from "../shared/BaseValidate";

export class RecoverPasswordParams extends BaseValidate {
  @Length(1, 11, { message: "A propriedade 'cpf' deve ter entre 1 e 11 caracteres" })
  @IsString({ message: "A propriedade 'cpf' deve ser uma string" })
  @IsNotEmpty({ message: "A propriedade 'cpf' não pode ser vazia" })
  cpf: string;
 
  private constructor(cpf: string) {
    super();
    this.cpf = cpf;
  }

  static async create(cpf: string): Promise<RecoverPasswordParams> {
    const params = new RecoverPasswordParams(cpf);
    await RecoverPasswordParams.validate(params);
    return params;
  }
}
