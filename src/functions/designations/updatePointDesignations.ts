import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { DesignationRepository } from "../../repositories/DesignationRepository";
import { JsonHandler } from "../../shared/JsonHandler";
import { BadRequestException, Exception, ForbiddenException } from "../../shared/Exception";
import { SendUpdateDesignation } from "../../services/SendUpdateDesignation";
import { DesignationStatus } from "@prisma/client";
import { DesignationStatusPT_BR } from "enums/DesignationStatusPT_BR";

const designationRepository = new DesignationRepository();
const sendUpdateDesignation = new SendUpdateDesignation();

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const designationId = _event.pathParameters?.designationId;
    const pointId = _event.pathParameters?.pointId;
    const body = JsonHandler.parse<{ status: boolean }>(_event.body);
    if (!designationId) throw new BadRequestException( "Parâmetros inválidos");

    if (body.status === undefined) throw new BadRequestException( "Status inválido");
    if (!pointId) throw new BadRequestException( "Ponto inválido");

    const designation = await designationRepository.findByDesignationId(designationId);
    if (!designation) {
      throw new Exception(404, "Designação não encontrada");
    }

    if (designation.status !== DesignationStatus.OPEN && designation.status !== DesignationStatus.IN_PROGRESS) {
      throw new ForbiddenException( `Designação não pode ser enviada, pois está ${DesignationStatusPT_BR[designation.status]}`);
    }

    designation.updatePointStatus(pointId, body.status);

    await sendUpdateDesignation.execute(designation);

    return ResponseHandler.success({ message: "Ponto atualizado com sucesso" });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
