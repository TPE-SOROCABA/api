import type { APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../../shared/ResponseHandler";
import { Exception } from "../../../shared/Exception";
import { InputParticipantIncidents, InputParticipantIncidentsUpdate } from "../../../contracts/InputParticipantIncidents";
import { JsonHandler } from "../../../shared/JsonHandler";
import { prisma } from "../../../infra/prismaClient";

export const handler: Handler = async (_event: APIGatewayProxyEventV2 & { requestContext: { authorizer: { principalId: string } } }): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const id = _event.pathParameters?.incidentId;
    const body = JsonHandler.parse<InputParticipantIncidents>(_event.body || "{}");

    if (!id) {
      return ResponseHandler.error({ message: "Id do incidente não informado" });
    }

    const params = await InputParticipantIncidentsUpdate.create(body?.status);
    const incidentEntity = await prisma.incidentHistories.findFirst({ where: { id } });

    if (!incidentEntity) {
      throw new Exception(404, "Incidente não encontrado");
    }

    console.log(`Atualizando incidente ${incidentEntity.id}`);
    await prisma.incidentHistories.update({
      where: { id },
      data: {
        status: params.status,
      },
    });
    
    return ResponseHandler.success({ message: "Incidente atualizado com sucesso" });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
