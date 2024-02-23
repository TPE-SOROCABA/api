import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { CreateUserParams } from "../contracts/CreateUserParams";
import { ResponseHandler } from "../shared/ResponseHandler";
import { Login } from "../domain/Login";
import { User } from "../repositories/models/User";
import { connectToDatabase } from "../infra/connectToDatabase";
import { JsonHandler } from "../shared/JsonHandler";

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();
    
    const body = JsonHandler.parse<CreateUserParams>(_event.body || "{}");
    console.log(`Usuário ${body.name} está tentando criar uma conta com os dados: ${JSON.stringify({...body, password: "*****"})}`);
    const params = await CreateUserParams.create({
      name: body.name,
      email: body.email,
      cpf: body.cpf,
      password: body.password,
      avatar: body.avatar,
    });
    const login = Login.create(params);
    console.log(`Usuário ${login.cpf} está tentando criar uma conta`);

    const user = await User.create({ ...params, ...login });
    console.log(`Usuário ${user.name} criado com sucesso`);

    return ResponseHandler.success(user);
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
