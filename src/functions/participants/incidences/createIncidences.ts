import type { APIGatewayProxyStructuredResultV2, Handler, APIGatewayProxyEventV2WithRequestContext, APIGatewayEventRequestContextWithAuthorizer } from "aws-lambda";
import { ResponseHandler } from "../../../shared/ResponseHandler";
import { connectToDatabase } from "../../../infra/connectToDatabase";
import { JsonHandler } from "../../../shared/JsonHandler";
import { InputParticipantIncidents } from "../../../contracts/InputParticipantIncidents";
import { IIncidentHistory, IncidentHistoryModel } from "../../../repositories/models/IncidentHistoryModel";
import { ParticipantModel } from "../../../repositories/models/ParticipantModel";
import { IncidentStatus } from "../../../enums/IncidentStatus";
import { DesignationStatus } from "../../../enums/DesignationStatus";
import { DesignationModel } from "../../../repositories/models/DesignationModel";
import { Designation } from "../../../domain/Designation";
import { Types } from "mongoose";
import { Exception } from "../../../shared/Exception";
import { GroupModel } from "../../../repositories/models/GroupModel";

type APIGatewayEventCustom = APIGatewayProxyEventV2WithRequestContext<
  APIGatewayEventRequestContextWithAuthorizer<{
    groupId: string;
    principalId: string;
  }>
>;

export const handler: Handler = async (_event: APIGatewayEventCustom): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();
    const id = _event.pathParameters?.participantId;
    const body = JsonHandler.parse<InputParticipantIncidents>(_event.body || "{}");
    const reporterId = _event.requestContext.authorizer.principalId;

    const params = await InputParticipantIncidents.create({
      reason: body?.reason,
    });

    if (!id) {
      throw new Exception(400, "Id do participante não informado");
    }

    if (!params.reason) {
      throw new Exception(400, "Motivo do incidente não informado");
    }

    if (!reporterId) {
      throw new Exception(400, "Id do reporter não informado");
    }

    const [participant, reporter, group] = await Promise.all([
      ParticipantModel.findById(id),
      ParticipantModel.findById(reporterId),
      GroupModel.findOne({ participants: id })
    ]);

    if (!participant || !reporter || !group) {
      throw new Exception(404, "Parâmetros inválidos");
    }
    
    const designationModel = await DesignationModel.findOne({ group: group._id, status: DesignationStatus.OPEN });
    if (!designationModel) {
      return ResponseHandler.error({ message: "Designação não encontrada" });
    }

    const incident: IIncidentHistory = {
      createdAt: new Date(),
      updatedAt: new Date(),
      designation: designationModel._id,
      participant: new Types.ObjectId(participant._id),
      reporter: new Types.ObjectId(reporter._id),
      reason: params.reason,
      status: IncidentStatus.OPEN,
    };

    console.log(`Criando incidente para o participante ${participant.name}, incidente: ${JSON.stringify(incident, null, 2)}`);
    const incidentModel = await IncidentHistoryModel.create(incident);
    console.log(`Incidente criado com sucesso`);

    console.log(`Atualizando histórico do participante ${participant.name}`);
    await ParticipantModel.updateOne({ _id: id }, { incident_history: incidentModel._id });
    console.log(`Histórico do participante ${participant.name} atualizado com sucesso`);

    return ResponseHandler.success({ message: "Incidente criado com sucesso", incident });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
