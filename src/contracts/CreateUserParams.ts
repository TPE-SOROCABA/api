import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator";
import { BaseValidate } from "../shared/BaseValidate";

type CreateUserParamsProps = {
  name: string;
  email: string;
  cpf: string;
  password: string;
  avatar?: string;
};

export class CreateUserParams extends BaseValidate {
  @Length(1, 255, { message: "A propriedade 'name' deve ter entre 1 e 255 caracteres" })
  @IsString({ message: "A propriedade 'name' deve ser uma string" })
  @IsNotEmpty({ message: "A propriedade 'name' não pode ser vazia" })
  name: string;

  @Length(1, 255, { message: "A propriedade 'email' deve ter entre 1 e 255 caracteres" })
  @IsString({ message: "A propriedade 'email' deve ser uma string" })
  @IsNotEmpty({ message: "A propriedade 'email' não pode ser vazia" })
  email: string;

  @Length(1, 11, { message: "A propriedade 'cpf' deve ter entre 1 e 11 caracteres" })
  @IsString({ message: "A propriedade 'cpf' deve ser uma string" })
  @IsNotEmpty({ message: "A propriedade 'cpf' não pode ser vazia" })
  cpf: string;

  @Length(1, 16, { message: "A propriedade 'password' deve ter entre 1 e 16 caracteres" })
  @IsString({ message: "A propriedade 'password' deve ser uma string" })
  @IsNotEmpty({ message: "A propriedade 'password' não pode ser vazia" })
  password: string;

  @IsString({ message: "A propriedade 'email' deve ser uma string" })
  @IsOptional()
  avatar?: string;

  private constructor(name: string, email: string, cpf: string, password: string, avatar?: string) {
    super();
    this.name = name;
    this.email = email;
    this.avatar = avatar;
    this.cpf = cpf;
    this.password = password;
  }

  static async create(params: CreateUserParamsProps): Promise<CreateUserParams> {
    const createUser = new CreateUserParams(params.name, params.email, params.cpf, params.password, params.avatar);
    await CreateUserParams.validate(createUser);
    return createUser;
  }
}
