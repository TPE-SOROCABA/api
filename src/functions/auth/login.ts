import { LoginUtils } from './../../domain/Login';
import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { InputLogin } from "../../contracts/InputLogin";
import { JsonHandler } from "../../shared/JsonHandler";
import { connectToDatabase } from "../../infra/connectToDatabase";
import { Exception } from "../../shared/Exception";
import { ParticipantModel } from '../../repositories/models/ParticipantModel';
import { GroupModel } from '../../repositories/models/GroupModel';
import { DesignationRepository } from '../../repositories/DesignationRepository';
import { Designation } from '../../domain/Designation';

const designationRepository = new DesignationRepository();

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();

    const body = JsonHandler.parse<InputLogin>(_event.body);
    const login = await InputLogin.create(body.cpf, body.password);
    console.log(`Usuário ${login.cpf} está tentando logar`);

    const participant = await ParticipantModel.findOne({ 
      cpf: login.cpf,
      'auth.password': LoginUtils.encryptPassword(login.password), 
    }).transform((doc) => {
      if (!doc) return;
      return {
        id: doc._id,
        name: doc.name,
        profile: doc.profile,
      }
    });

    console.log(participant);
    
    if (!participant) {
      console.log(`Usuário ${login.cpf} não encontrado`);
      throw new Exception(401, "Credenciais inválidas");
    }
    console.log(`Usuário ${participant.name} logado com sucesso`);

    const group = await GroupModel.findOne({ participants: participant.id })
    
    let designation: Designation | null = null;

    if (group) {
      designation = await designationRepository.findOne(group._id.toString());
    }

    return ResponseHandler.success({
      token: LoginUtils.createJWT({ 
        ...participant, 
        groupId: group?._id?.toString() ?? null,
        designation: designation ? {
          id: designation.id,
          expiration: designation.getNextDate() ,
          name: designation.group.name ,
        } : null,
      }),
    });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
