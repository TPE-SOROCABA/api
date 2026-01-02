import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { InputLogin } from "../../contracts/InputLogin";
import { JsonHandler } from "../../shared/JsonHandler";
import { Exception } from "../../shared/Exception";
import { LoginUtils } from "../../domain/Login";
import { prisma } from "../../infra/prismaClient";
import { ParticipantProfile } from "@prisma/client";

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  const responseHandler = new ResponseHandler(_event);
  try {
    const body = JsonHandler.parse<InputLogin>(_event.body);
    const login = await InputLogin.create(body.phone, body.password);

    console.log(`O usuário com CPF ${login.phone} solicitou a redefinição de senha.`);

    const participant = await prisma.participants.findUnique({ where: { phone: login.phone }, include: { ParticipantsGroup: true } });
    if (!participant) {
      console.log(`Usuário ${login.phone} não encontrado`);
      throw new Exception(401, "Credenciais inválidas");
    }

    let profile: string = ParticipantProfile.PARTICIPANT;
    if (participant.profile === ParticipantProfile.COORDINATOR || participant.profile === ParticipantProfile.ADMIN_ANALYST) {
      profile = participant.profile;
    } else {
      profile = participant.ParticipantsGroup.find(pg => pg.profile === ParticipantProfile.CAPTAIN || pg.profile === ParticipantProfile.ASSISTANT_CAPTAIN)?.profile || ParticipantProfile.PARTICIPANT;
    }

    if (profile === ParticipantProfile.PARTICIPANT) {
      console.log(`Usuário ${participant.name} não tem permissão para logar`);
      throw new Exception(403, "Usuário não tem permissão para logar");
    }

    await prisma.auth.update({
      where: { participantId: participant.id },
      data: {
        password: LoginUtils.encryptPassword(login.password),
        expiredAt: null,
        updatedAt: new Date(),
        resetPasswordCode: null,
        loginAttempts: 0,
      },
    });

    return responseHandler.success({
      message: "Senha redefinida com sucesso",
    });
  } catch (error) {
    return responseHandler.error(error);
  }
};
