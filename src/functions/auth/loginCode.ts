import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { User } from "../../repositories/models/User";
import { connectToDatabase } from "../../infra/connectToDatabase";
import { JsonHandler } from "../../shared/JsonHandler";
import { LoginCodeParams } from "../../contracts/LoginCodeParams";
import { Exception } from "../../shared/Exception";
import { Login } from '../../domain/Login';

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();

    const body = JsonHandler.parse<LoginCodeParams>(_event.body || "{}");
    console.log(`Usuário ${body.cpf} está tentando recuperar a senha`);
    const params = await LoginCodeParams.create(body.cpf, body.code);

    const user = await User.findOne({ cpf: params.cpf, codeRecoveryPassword: params.code });
    if (!user) {
      throw new Exception(404, "Usuário não encontrado ou código de recuperação inválido");
    }

    const token = Login.createJWT(user.toJSON());
   
    return ResponseHandler.success({ token });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};