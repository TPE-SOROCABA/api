import type { APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../../shared/ResponseHandler";
import { BadRequestException, Exception, ForbiddenException, NotFoundException } from "../../../shared/Exception";
import { prisma } from "../../../infra/prismaClient";
import { DesignationStatus } from "@prisma/client";

export const handler: Handler = async (_event: APIGatewayProxyEventV2 & { requestContext: { authorizer: { principalId: string } } }): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const id = _event.pathParameters?.incidentId;
   
    if (!id) {
      throw new BadRequestException("Parâmetros inválidos");
    }

    const incidentEntity = await prisma.incidentHistories.findFirst({ where: { id }, include: { designation:true } });

    if (!incidentEntity) {
      throw new NotFoundException("Incidente não encontrado");
    }

    if (incidentEntity.designation.status !== DesignationStatus.OPEN && incidentEntity.designation.status !== DesignationStatus.IN_PROGRESS) {
      throw new ForbiddenException("Designação está cancelada ou arquivada não é possível excluir incidentes");
    }

    console.log(`Deletando incidente ${incidentEntity.id}`);
    await prisma.incidentHistories.delete({ where: { id } });
    
    return ResponseHandler.success({ message: "Incidente deletado com sucesso" });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
