import { WhatsAppService } from '../../services/WhatsAppService';
import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { connectToDatabase } from "../../infra/connectToDatabase";
import { JsonHandler } from "../../shared/JsonHandler";
import { InputRecoverPassword } from "../../contracts/InputRecoverPassword";
import { Exception } from "../../shared/Exception";
import { Z_APIWhatsAppAdapter } from '../../infra/adapter/Z_APIWhatsAppAdapter';
import { ParticipantModel } from '../../repositories/models/ParticipantModel';

const whatsAppAdapter = new Z_APIWhatsAppAdapter();
const whatsAppService = new WhatsAppService(whatsAppAdapter);

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();

    const body = JsonHandler.parse<InputRecoverPassword>(_event.body || "{}");
    console.log(`Usuário ${body.cpf} está tentando recuperar a senha`);
    const params = await InputRecoverPassword.create(body.cpf);

    const user = await ParticipantModel.findOne({ cpf: params.cpf });
    if (!user) {
      throw new Exception(404, "Usuário não encontrado");
    }

    if (!user?.auth) {
      user.auth = {
        password: "",
        resetPasswordCode: "",
      };
    }
    
    const code = generateCode();
    user.auth.resetPasswordCode = code.toString();
    await user.save();

    const message = `Olá, ${user.name}! Seu código de recuperação de senha é \n\n*${code}*\n\nEle expirará em 5 minutos.\nNão compartilhe com ninguém.\n\nAtenciosamente, TPE Digital`;
    await whatsAppService.sendMessage({
      to: user.phone,
      message
    });
    return ResponseHandler.success({ message: "Código de recuperação enviado com sucesso" });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};

/**
 * @description - Genera um código de 6 dígitos
 * @returns {number} - código de 6 dígitos
 * @example - generateCode() => 123456
 */
function generateCode() {
  const code = Math.floor(100000 + Math.random() * 900000);
  if (code.toString().length === 6) {
    return code;
  }
  return generateCode();
}