import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../shared/ResponseHandler";
import { LoginParams } from "../contracts/LoginParams";
import { JsonHandler } from "../shared/JsonHandler";
import { Login } from "../domain/Login";
import { User } from "../repositories/models/User";
import { connectToDatabase } from "../infra/connectToDatabase";
import { Exception } from "../shared/Exception";

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();
    
    const body = JsonHandler.parse<LoginParams>(_event.body);
    const params = await LoginParams.create(body.cpf, body.password);
    const login = Login.create(params);
    console.log(`Usuário ${login.cpf} está tentando logar`);

    const user = await User.findOne({ cpf: login.cpf, password: login.password });
    if (!user) {
      console.log(`Usuário ${login.cpf} não encontrado`);
      throw new Exception(401, "Credenciais inválidas");
    }
    console.log(`Usuário ${user.name} logado com sucesso`);

    return ResponseHandler.success({
      token: login.createJWT(user.toJSON()),
    });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
