import { WhatsAppService } from '../../services/WhatsAppService';
import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { JsonHandler } from "../../shared/JsonHandler";
import { InputRecoverPassword } from "../../contracts/InputRecoverPassword";
import { Exception } from "../../shared/Exception";
import { Z_APIWhatsAppAdapter } from '../../infra/adapter/Z_APIWhatsAppAdapter';
import { prisma } from '../../infra/prismaClient';
import { LoginUtils } from "./../../domain/Login";
import { ParticipantProfile } from '@prisma/client';

const whatsAppAdapter = new Z_APIWhatsAppAdapter();
const whatsAppService = new WhatsAppService(whatsAppAdapter);

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {

    const body = JsonHandler.parse<InputRecoverPassword>(_event.body || "{}");
    console.log(`Usuário ${body.phone} está tentando recuperar a senha`);
    const params = await InputRecoverPassword.create(body.phone);

    const participant = await prisma.participants.findUnique({ where: { phone: params.phone } });
    if (!participant) {
      throw new Exception(404, "Usuário não encontrado");
    }

    if (participant.profile === ParticipantProfile.PARTICIPANT){
      console.log(`Usuário ${participant.name} não tem permissão para logar`);
      throw new Exception(403, "Usuário não tem permissão para logar");
    }

    const code = generateCode();

    await prisma.auth.update({
      where: { participantId: participant.id },
      data: { 
        resetPasswordCode: String(code),
        updatedAt: new Date(),
        expiredAt: new Date(new Date().getTime() + 5 * 60000) // 5 minutos
      }
    });
   
    const payload = LoginUtils.createJWT({
      phone: participant.phone,
      code
    })

    const message = `Olá, ${participant.name}! Seu código de recuperação de senha é \n\n*${code}*\n\nEle expirará em 5 minutos.\nNão compartilhe com ninguém.\n\nAtenciosamente, TPE Digital`;
    await whatsAppService.sendMessage({
      phone: participant.phone,
      message,
      title: "*TPE Digital - Recuperação de senha*",
      linkUrl: `${process.env.FRONTEND_URL}/forgot-password/check-number?code=${payload}`,
      linkDescription: "Clique aqui para acessar a recuperação de senha",
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