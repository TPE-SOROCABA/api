import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator";
import { BaseValidate } from "../shared/BaseValidate";

type CreateUserParamsProps = {
  name: string;
  email: string;
  cpf: string;
  password: string;
  phone: string;
  avatar?: string;
};

export class CreateUserParams extends BaseValidate {
  @Length(1, 255, { message: "A propriedade 'name' deve ter entre 1 e 255 caracteres" })
  @IsString({ message: "A propriedade 'name' deve ser uma string" })
  name: string;

  @Length(1, 255, { message: "A propriedade 'email' deve ter entre 1 e 255 caracteres" })
  @IsString({ message: "A propriedade 'email' deve ser uma string" })
  email: string;

  @Length(1, 11, { message: "A propriedade 'cpf' deve ter entre 1 e 11 caracteres" })
  @IsString({ message: "A propriedade 'cpf' deve ser uma string" })
  cpf: string;

  @Length(1, 16, { message: "A propriedade 'password' deve ter entre 1 e 16 caracteres" })
  @IsString({ message: "A propriedade 'password' deve ser uma string" })
  password: string;

  @Length(1, 11, { message: "A propriedade 'phone' deve ter entre 1 e 16 caracteres" })
  @IsString({ message: "A propriedade 'phone' deve ser uma string" })
  phone: string;

  @IsString({ message: "A propriedade 'email' deve ser uma string" })
  @IsOptional()
  avatar?: string;

  private constructor(name: string, email: string, cpf: string, password: string, phone: string, avatar?: string) {
    super();
    this.name = name;
    this.email = email;
    this.avatar = avatar;
    this.cpf = cpf;
    this.password = password;
    this.phone = phone;
  }

  static async create(params: CreateUserParamsProps): Promise<CreateUserParams> {
    const createUser = new CreateUserParams(params.name, params.email, params.cpf, params.password, params.phone, params.avatar);
    await CreateUserParams.validate(createUser);
    return createUser;
  }
}
