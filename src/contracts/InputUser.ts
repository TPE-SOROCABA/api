import { IsOptional, IsString, Length } from "class-validator";
import { BaseValidate } from "../shared/BaseValidate";

type InputUserProps = {
  name: string;
  email: string;
  cpf: string;
  password: string;
  phone: string;
  avatar?: string;
};

export class InputUser extends BaseValidate {
  @Length(1, 255, { message: "O nome deve ter entre 1 e 255 caracteres" })
  @IsString({ message: "O nome deve ser uma sequência de caracteres" })
  name: string;

  @Length(1, 255, { message: "O e-mail deve ter entre 1 e 255 caracteres" })
  @IsString({ message: "O e-mail deve ser uma sequência de caracteres" })
  email: string;

  @Length(1, 11, { message: "O CPF deve ter entre 1 e 11 caracteres" })
  @IsString({ message: "O CPF deve ser uma sequência de caracteres" })
  cpf: string;

  @Length(1, 16, { message: "A senha deve ter entre 1 e 16 caracteres" })
  @IsString({ message: "A senha deve ser uma sequência de caracteres" })
  password: string;

  @Length(1, 11, { message: "O número de telefone deve ter entre 1 e 11 caracteres" })
  @IsString({ message: "O número de telefone deve ser uma sequência de caracteres" })
  phone: string;

  @IsString({ message: "O avatar deve ser uma sequência de caracteres" })
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

  static async create(params: InputUserProps): Promise<InputUser> {
    const createUser = new InputUser(params.name, params.email, params.cpf, params.password, params.phone, params.avatar);
    await InputUser.validate(createUser);
    return createUser;
  }
}
