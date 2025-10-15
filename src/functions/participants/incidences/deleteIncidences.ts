import type { APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../../shared/ResponseHandler";
import { BadRequestException, Exception, ForbiddenException, NotFoundException } from "../../../shared/Exception";
import { prisma } from "../../../infra/prismaClient";
import { DesignationStatus } from "@prisma/client";

export const handler: Handler = async (_event: APIGatewayProxyEventV2 & { requestContext: { authorizer: { principalId: string } } }): Promise<APIGatewayProxyStructuredResultV2> => {
  const responseHandler = new ResponseHandler(_event);
  try {
    const incidentId = _event.pathParameters?.incidentId;
    const participantId = _event.pathParameters?.participantId;
    const designationId = _event.pathParameters?.designationId;
   
    if (!incidentId) {
      throw new BadRequestException("Id do incidente não informado");
    }

    if (!participantId) {
      throw new BadRequestException("Id do participante não informado");
    }

    if (!designationId) {
      throw new BadRequestException("Id da designação não informado");
    }

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

    if (incidentEntity.designation.status !== DesignationStatus.OPEN && incidentEntity.designation.status !== DesignationStatus.IN_PROGRESS) {
      throw new ForbiddenException("Designação está cancelada ou arquivada não é possível excluir incidentes");
    }

    console.log(`Deletando incidente ${incidentEntity.id}`);
    await prisma.incidentHistories.delete({ where: { id: incidentId } });
    
    return responseHandler.success({ message: "Incidente deletado com sucesso" });
  } catch (error) {
    return responseHandler.error(error);
  }
};
