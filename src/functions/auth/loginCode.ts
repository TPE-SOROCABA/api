import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { connectToDatabase } from "../../infra/connectToDatabase";
import { JsonHandler } from "../../shared/JsonHandler";
import { InputLoginCode } from "../../contracts/InputLoginCode";
import { Exception } from "../../shared/Exception";
import { ParticipantModel } from "../../repositories/models/ParticipantModel";
import { LoginUtils } from "../../domain/Login";

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();

    const body = JsonHandler.parse<InputLoginCode>(_event.body || "{}");
    console.log(`Usuário ${body.cpf} está tentando recuperar a senha`);
    const params = await InputLoginCode.create(body.cpf, body.code);

    const participant = await ParticipantModel.findOne({ cpf: params.cpf, "auth.resetPasswordCode": params.code });

    if (!participant) {
      throw new Exception(404, "Usuário não encontrado ou código de recuperação inválido");
    }

    return ResponseHandler.success({
      token: LoginUtils.createJWT({ id: params.cpf }, { expiresIn: "5m" }),
    });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
