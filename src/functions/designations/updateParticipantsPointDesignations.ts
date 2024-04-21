import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { DesignationRepository } from "../../repositories/DesignationRepository";
import { JsonHandler } from "../../shared/JsonHandler";
import { Exception } from "../../shared/Exception";
import { SendUpdateDesignation } from "../../services/SendUpdateDesignation";

const designationRepository = new DesignationRepository();
const sendUpdateDesignation = new SendUpdateDesignation();

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const designationId = _event.pathParameters?.designationId;
    const pointId = _event.pathParameters?.pointId;
    const body = JsonHandler.parse<{ participants: string[] }>(_event.body);
    if (!designationId) throw new Exception(400, "Parâmetros inválidos");

    if (!pointId) throw new Exception(400, "Ponto inválido");

    const designation = await designationRepository.findByDesignationId(designationId);
    if (!designation) {
      throw new Exception(404, "Designação não encontrada");
    }

    designation.updateParticipants(pointId, body.participants);
    await sendUpdateDesignation.execute(designation);

    return ResponseHandler.success({ message: "Ponto atualizado com sucesso" });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
