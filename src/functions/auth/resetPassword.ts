import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { InputLogin } from "../../contracts/InputLogin";
import { JsonHandler } from "../../shared/JsonHandler";
import { connectToDatabase } from "../../infra/connectToDatabase";
import { Exception } from "../../shared/Exception";
import { ParticipantModel } from "../../repositories/models/ParticipantModel";
import { LoginUtils } from "../../domain/Login";

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();
    
    const body = JsonHandler.parse<InputLogin>(_event.body);
    const login = await InputLogin.create(body.cpf, body.password);
   
    console.log(`O usuário com CPF ${login.cpf} solicitou a redefinição de senha.`);

    const participant = await ParticipantModel.findOne({ cpf: login.cpf });
    if (!participant) {
      console.log(`Usuário ${login.cpf} não encontrado`);
      throw new Exception(401, "Credenciais inválidas");
    }
    if (!participant?.auth) {
      participant.auth = {
        password: "",
        resetPasswordCode: "",
      };
    }
    
    participant.auth.password = LoginUtils.encryptPassword(login.password);
    participant.auth.resetPasswordCode = "";
    await participant.save();

    return ResponseHandler.success({
      message: "Senha redefinida com sucesso",
    });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
