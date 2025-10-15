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
    const incidentId = _event.pathParameters?.incidentId;
    const participantId = _event.pathParameters?.participantId;
    const designationId = _event.pathParameters?.designationId;
    const body = JsonHandler.parse<InputParticipantIncidentsUpdate>(_event.body || "{}");

    if (!incidentId) {
      throw new BadRequestException("Id do incidente não informado");
    }

    if (!participantId) {
      throw new BadRequestException("Id do participante não informado");
    }

    if (!designationId) {
      throw new BadRequestException("Id da designação não informado");
    }

    const params = await InputParticipantIncidentsUpdate.create(body?.reason, body?.status);
    
    // Buscar o incidente específico da designação e participante
    const incidentEntity = await prisma.incidentHistories.findFirst({ 
      where: { 
        id: incidentId,
        participantId: participantId,
        designationId: designationId
      },
      include: {
        designation: true
      }
    });

    if (!incidentEntity) {
      throw new NotFoundException("Incidente não encontrado para este participante nesta designação");
    }

    if (incidentEntity.designation.status === DesignationStatus.CANCELLED || incidentEntity.designation.status === DesignationStatus.ARCHIVED) {
      throw new ForbiddenException("Designação está cancelada ou arquivada");
    }

    console.log(`Atualizando incidente ${incidentEntity.id}`);
    await prisma.incidentHistories.update({
      where: { id: incidentId },
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
