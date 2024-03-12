import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { LoginParams } from "../../contracts/LoginParams";
import { JsonHandler } from "../../shared/JsonHandler";
import { Login } from "../../domain/Login";
import { User } from "../../repositories/models/User";
import { connectToDatabase } from "../../infra/connectToDatabase";
import { Exception } from "../../shared/Exception";

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();
    
    const body = JsonHandler.parse<LoginParams>(_event.body);
    const params = await LoginParams.create(body.cpf, body.password);
    const login = Login.create(params);
    console.log(`O usuário com CPF ${login.cpf} solicitou a redefinição de senha.`);


    const user = await User.findOne({ cpf: login.cpf });
    if (!user) {
      console.log(`Usuário ${login.cpf} não encontrado`);
      throw new Exception(401, "Credenciais inválidas");
    }
    user.password = login.password;
    user.codeRecoveryPassword = undefined;
    await user.save();

    return ResponseHandler.success({
      message: "Senha redefinida com sucesso",
    });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
