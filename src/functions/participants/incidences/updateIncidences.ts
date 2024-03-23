import type { APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../../shared/ResponseHandler";
import { connectToDatabase } from "../../../infra/connectToDatabase";
import { IncidentHistoryModel } from "../../../repositories/models/IncidentHistoryModel";
import { Exception } from "../../../shared/Exception";
import { InputParticipantIncidents, InputParticipantIncidentsUpdate } from "../../../contracts/InputParticipantIncidents";
import { JsonHandler } from "../../../shared/JsonHandler";

export const handler: Handler = async (_event: APIGatewayProxyEventV2 & { requestContext: { authorizer: { principalId: string } } }): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();
    const id = _event.pathParameters?.incidentId;
    const body = JsonHandler.parse<InputParticipantIncidents>(_event.body || "{}");

    if (!id) {
      return ResponseHandler.error({ message: "Id do incidente não informado" });
    }

    const params = await InputParticipantIncidentsUpdate.create(body?.status);
    const incidentEntity = await IncidentHistoryModel.findById(id);

    if (!incidentEntity) {
      throw new Exception(404, "Incidente não encontrado");
    }

    await IncidentHistoryModel.updateOne(
      {
        _id: id,
      },
      {
        status: params.status,
        updatedAt: new Date(),
      }
    );
    
    return ResponseHandler.success({ message: "Incidente atualizado com sucesso" });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
