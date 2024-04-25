import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { DesignationRepository } from "../../repositories/DesignationRepository";
import { SendUpdateDesignation } from "../../services/SendUpdateDesignation";
import { SendAssignmentDesignation } from "services/SendAssignmentDesignation";
import { DesignationStatus } from "@prisma/client";

const designationRepository = new DesignationRepository();

const sendUpdateDesignation = new SendUpdateDesignation();

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    console.log("Enviando designações");
    const designationId = _event.pathParameters?.designationId;
    if (!designationId) {
      return ResponseHandler.error({ message: "Parâmetros inválidos" });
    }

    const designation = await designationRepository.findByDesignationId(designationId);
    console.log(`Designação encontrada: ${designation.group.name}`);

    await SendAssignmentDesignation(designation);

    designation.updateStatus(DesignationStatus.IN_PROGRESS);

    await sendUpdateDesignation.execute(designation);

    return ResponseHandler.success({ message: "Designação enviada com sucesso" });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
