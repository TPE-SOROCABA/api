import type { APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../../shared/ResponseHandler";
import { connectToDatabase } from "../../../infra/connectToDatabase";
import { JsonHandler } from "../../../shared/JsonHandler";
import { InputParticipantIncidents } from "../../../contracts/InputParticipantIncidents";
import { IncidentHistory } from "../../../domain/IncidentHistory";
import { IncidentHistoryModel } from "../../../repositories/models/IncidentHistoryModel";

export const handler: Handler = async (_event: APIGatewayProxyEventV2 & { requestContext: { authorizer: { principalId: string } } }): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();
    const id = _event.pathParameters?.participantId;
    const body = JsonHandler.parse<InputParticipantIncidents>(_event.body || "{}");
    const reporterId = _event.requestContext.authorizer.principalId;
    

    const params = await InputParticipantIncidents.create({
      reason: body?.reason,
    });

    if (!id) {
      return ResponseHandler.error({ message: "Id do participante não informado" });
    }

    const incident = IncidentHistory.create({ participantId: id, reporterId, ...params });

    const result = await IncidentHistoryModel.create(incident);

    return ResponseHandler.success({ message: "Incidente criado com sucesso", data: result });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
