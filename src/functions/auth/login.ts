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

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const body = JsonHandler.parse<InputLogin>(_event.body);
    const login = await InputLogin.create(body.cpf, body.password);
    console.log(`Usuário ${login.cpf} está tentando logar`);

    const [participant] = await prisma.$queryRaw<IParticipant[]>`
    select * from participants p 
    inner join auths a on a.participant_id = p.id
    where p.cpf = ${login.cpf} and a.password = ${LoginUtils.encryptPassword(login.password)}
  `;

    if (!participant) {
      console.log(`Usuário ${login.cpf} não encontrado`);
      throw new Exception(401, "Credenciais inválidas");
    }
    if (participant.profile === ParticipantProfile.PARTICIPANT){
      console.log(`Usuário ${participant.name} não tem permissão para logar`);
      throw new Exception(403, "Usuário não tem permissão para logar");
    }
    console.log(`Usuário ${participant.name} logado com sucesso`);

    const payload = await loginService.execute({
      cpf: participant.cpf,
      name: participant.name,
      profile: participant.profile,
      participantId: participant.participant_id,
      profile_photo: participant.profile_photo || "",
    });
    console.log(`Usuário ${payload.name} logado com sucesso`);
    return ResponseHandler.success({
      token: LoginUtils.createJWT(payload),
    });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};


