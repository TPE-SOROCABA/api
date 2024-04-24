import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { InputLogin } from "../../contracts/InputLogin";
import { JsonHandler } from "../../shared/JsonHandler";
import { Exception } from "../../shared/Exception";
import { LoginUtils } from "../../domain/Login";
import { prisma } from "../../infra/prismaClient";
import { ParticipantProfile } from "@prisma/client";

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const body = JsonHandler.parse<InputLogin>(_event.body);
    const login = await InputLogin.create(body.cpf, body.password);

    console.log(`O usuário com CPF ${login.cpf} solicitou a redefinição de senha.`);

    const participant = await prisma.participants.findUnique({ where: { cpf: login.cpf } });
    if (!participant) {
      console.log(`Usuário ${login.cpf} não encontrado`);
      throw new Exception(401, "Credenciais inválidas");
    }

    if (participant.profile === ParticipantProfile.PARTICIPANT){
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
      },
    });

    return ResponseHandler.success({
      message: "Senha redefinida com sucesso",
    });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
