import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { JsonHandler } from "../../shared/JsonHandler";
import { InputLoginCode } from "../../contracts/InputLoginCode";
import { BadRequestException, Exception } from "../../shared/Exception";
import { LoginUtils } from "../../domain/Login";
import { prisma } from "../../infra/prismaClient";
import { DesignationRepository } from "../../repositories/DesignationRepository";
import { LoginService } from "../../services/LoginService";
import { ParticipantProfile } from "@prisma/client";

const designationRepository = new DesignationRepository();
const loginService = new LoginService(designationRepository);

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
 const responseHandler = new ResponseHandler(_event);
  try {
    const body = JsonHandler.parse<InputLoginCode>(_event.body || "{}");
    console.log(`Usuário ${body.phone} está tentando recuperar a senha`);
    const params = await InputLoginCode.create(body.phone, body.code);

    const participant = await prisma.participants.findUnique({ where: { phone: params.phone }, include: { Auth: true } });

    if (!participant || !participant.Auth?.expiredAt) {
      throw new Exception(404, "Usuário não encontrado ou código de recuperação inválido");
    }

    if (participant.profile === ParticipantProfile.PARTICIPANT){
      console.log(`Usuário ${participant.name} não tem permissão para logar`);
      throw new Exception(403, "Usuário não tem permissão para logar");
    }

    if (participant.Auth.resetPasswordCode !== params.code) {
      throw new BadRequestException( "Código de recuperação inválido");
    }

    if (new Date() > participant.Auth.expiredAt) {
      throw new BadRequestException( "Código de recuperação expirado");
    }

    const payload = await loginService.execute({
      name: participant.name,
      cpf: participant.cpf || "",
      profile: participant.profile,
      participantId: participant.id,
      profile_photo: participant.profile_photo || "",
    });

    return responseHandler.success({
      token: LoginUtils.createJWT(payload),
    });
  } catch (error) {
    return responseHandler.error(error);
  }
};
