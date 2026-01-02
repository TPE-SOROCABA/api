import { LoginUtils } from "./../../domain/Login";
import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { InputLogin } from "../../contracts/InputLogin";
import { JsonHandler } from "../../shared/JsonHandler";
import { Exception } from "../../shared/Exception";
import { DesignationRepository } from "../../repositories/DesignationRepository";
import { prisma } from "../../infra/prismaClient";
import { LoginService } from "../../services/LoginService";
import { ParticipantProfile } from "@prisma/client";
import { FakeImage } from "shared/FakeImage";

interface IParticipant {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  profile_photo: null;
  profile: string;
  computed: string;
  sex: string;
  password: string;
  reset_password_code: null;
  participant_id: string;
}

const designationRepository = new DesignationRepository();
const loginService = new LoginService(designationRepository);

const loginAttempts: Record<string, number> = {};

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  const responseHandler = new ResponseHandler(_event);
  try {
    const body = JsonHandler.parse<InputLogin>(_event.body);
    const login = await InputLogin.create(body.phone, body.password);
    console.log(`Usuário ${login.phone} está tentando logar`);

    const participant = await prisma.participants.findUnique({
      where: { phone: login.phone, },
      include: {
        Auth: {
          where: { password: LoginUtils.encryptPassword(login.password) },
        },
        ParticipantsGroup: true
      }
    });
    console.log(participant)
    if (!participant) {
      console.log(`Usuário ${login.phone} não encontrado`);
      throw new Exception(401, "Usuário não encontrado");
    }

    if (!participant.Auth) {
      console.log(`Senha incorreta para o usuário ${login.phone}`);
      loginAttempts[login.phone] = (loginAttempts[login.phone] || 0) + 1;

      if (loginAttempts[login.phone] > 3) {
        throw new Exception(429, "Muitas tentativas incorretas. Por favor, redefina sua senha.");
      }

      throw new Exception(401, "Senha inválida");
    }

    delete loginAttempts[login.phone];

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

    const payload = await loginService.execute({
      cpf: participant?.cpf || "",
      name: participant.name,
      profile: profile,
      participantId: participant.id,
      profile_photo: FakeImage(participant).profile_photo || "",
    });
    console.log(`Usuário ${payload.name} logado com sucesso`, payload);
    return responseHandler.success({
      token: LoginUtils.createJWT(payload),
    });
  } catch (error) {
    return responseHandler.error(error);
  }
};
