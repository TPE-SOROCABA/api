import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { connectToDatabase } from "../../infra/connectToDatabase";
import { ParticipantProfile } from "../../enums/ParticipantProfile";
import { IParticipant, ParticipantModel } from "../../repositories/models/ParticipantModel";
import { IncidentHistoryModel } from "../../repositories/models/IncidentHistoryModel";
import { IParticipantModel } from "./interfaces/IParticipantModel";
import { JsonHandler } from "../../shared/JsonHandler";
import { LoginUtils } from "../../domain/Login";
import { ParticipantUtils } from "../../domain/Participant";
import { GroupModel } from "../../repositories/models/GroupModel";
import { Exception } from "../../shared/Exception";
import { Types } from "mongoose";

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();

    const groupId = _event.queryStringParameters?.groupId;

    if (!groupId) {
      return ResponseHandler.error("Group id is required");
    }

    const body = JsonHandler.parse<IParticipant & { password: string }>(_event.body);
    // criar validação de input do usuário
    const { password, ...participantData } = body;

    if (!participantData.auth) {
      participantData.auth = {
        password: "",
        resetPasswordCode: "",
      };
    }

    participantData.auth.password = LoginUtils.encryptPassword(password);
    participantData.computed = ParticipantUtils.calculateComputedField(body);

    const group = await GroupModel.findById(groupId);
    if (!group) {
      throw new Exception(404, "Grupo não encontrado");
    }

    const participant = await ParticipantModel.create(participantData);
    group.participants.push(new Types.ObjectId(participant._id));
    await group.save();

    return ResponseHandler.success({ message: "Participante criado com sucesso" });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
