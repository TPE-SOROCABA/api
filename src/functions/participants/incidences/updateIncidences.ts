import type { APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../../shared/ResponseHandler";
import { BadRequestException, Exception, ForbiddenException, NotFoundException } from "../../../shared/Exception";
import { InputParticipantIncidentsUpdate } from "../../../contracts/InputParticipantIncidents";
import { JsonHandler } from "../../../shared/JsonHandler";
import { prisma } from "../../../infra/prismaClient";
import { DesignationStatus } from "@prisma/client";

export const handler: Handler = async (_event: APIGatewayProxyEventV2 & { requestContext: { authorizer: { principalId: string } } }): Promise<APIGatewayProxyStructuredResultV2> => {
  const responseHandler = new ResponseHandler(_event);
  try {
    const id = _event.pathParameters?.incidentId;
    const body = JsonHandler.parse<InputParticipantIncidentsUpdate>(_event.body || "{}");

    if (!id) {
      throw new BadRequestException("Parâmetros inválidos");
    }

    const params = await InputParticipantIncidentsUpdate.create(body?.reason, body?.status);
    const incidentEntity = await prisma.incidentHistories.findFirst({ where: { id } });

    if (!incidentEntity) {
      throw new NotFoundException("Incidente não encontrado");
    }

    const designation = await prisma.designations.findFirst({
      where: {
        id: incidentEntity.designationId,
        status: {
          notIn: [DesignationStatus.CANCELLED, DesignationStatus.ARCHIVED],
        },
      },
    });

    if (!designation) {
      throw new ForbiddenException("Designação está cancelada ou arquivada");
    }

    console.log(`Atualizando incidente ${incidentEntity.id}`);
    await prisma.incidentHistories.update({
      where: { id },
      data: {
        status: params?.status ?? incidentEntity.status,
        reason: params?.reason ?? incidentEntity.reason,
      },
    });
    
    return responseHandler.success({ message: "Incidente atualizado com sucesso" });
  } catch (error) {
    return responseHandler.error(error);
  }
};
