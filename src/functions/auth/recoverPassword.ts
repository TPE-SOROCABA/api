import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { JsonHandler } from "../../shared/JsonHandler";
import { InputRecoverPassword } from "../../contracts/InputRecoverPassword";
import { Exception } from "../../shared/Exception";
import { prisma } from '../../infra/prismaClient';
import { LoginUtils } from "./../../domain/Login";
import { ParticipantProfile } from '@prisma/client';
import { MessageGenerator, MessageType } from "../../services/MessageGenerator";
import { SQSMessageDispatcher } from "../../services/SQSMessageDispatcher";

const messageGenerator = new MessageGenerator();
const sqsDispatcher = new SQSMessageDispatcher();

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  const responseHandler = new ResponseHandler(_event);
  try {

    const body = JsonHandler.parse<InputRecoverPassword>(_event.body || "{}");
    console.log(`[AUTH-RECOVER] Iniciando recuperação de senha para: ${body.phone}`);
    const params = await InputRecoverPassword.create(body.phone);

    const participant = await prisma.participants.findUnique({ where: { phone: params.phone }, include: { ParticipantsGroup: true } });
    if (!participant) {
      console.log(`[AUTH-RECOVER] Falha: Usuário ${body.phone} não encontrado.`);
      throw new Exception(404, "Usuário não encontrado");
    }

    let profile: string = ParticipantProfile.PARTICIPANT;
    if (participant.profile === ParticipantProfile.COORDINATOR || participant.profile === ParticipantProfile.ADMIN_ANALYST) {
      profile = participant.profile;
    } else {
      profile = participant.ParticipantsGroup.find(pg => pg.profile === ParticipantProfile.CAPTAIN || pg.profile === ParticipantProfile.ASSISTANT_CAPTAIN)?.profile || ParticipantProfile.PARTICIPANT;
    }

    if (profile === ParticipantProfile.PARTICIPANT) {
      console.log(`[AUTH-RECOVER] Falha: Usuário ${participant.name} não possui perfil de acesso.`);
      throw new Exception(403, "Usuário não tem permissão para logar");
    }

    const code = generateCode();

    console.log(`[AUTH-RECOVER] Gerando novo código OTP para ${participant.name}.`);
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

    const message = messageGenerator.generate(MessageType.OTP_SIMPLE, {
      recipientName: participant.name.split(" ")[0],
      code: String(code)
    });

    console.log(`[AUTH-RECOVER] Enfileirando mensagem OTP via SQS.`);
    await sqsDispatcher.dispatch({
      phone: participant.phone,
      message,
      code: String(code),
      title: "*TPE Digital - Recuperação de senha*",
      type: "otp",
    });

    return responseHandler.success({ message: "Código de recuperação enviado com sucesso" });
  } catch (error) {
    console.error(`[AUTH-RECOVER] Erro no fluxo de recuperação:`, error);
    return responseHandler.error(error);
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