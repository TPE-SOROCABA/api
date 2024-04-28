import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { BadRequestException, NotFoundException } from "../../shared/Exception";
import { DesignationRepository } from "../../repositories/DesignationRepository";

const designationRepository = new DesignationRepository();

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
 const responseHandler = new ResponseHandler(_event);
  try {
    const designationId = _event.pathParameters?.designationId;

    if (!designationId) {
      throw new BadRequestException("Parâmetros inválidos");
    }

    const designation = await designationRepository.findByDesignationId(designationId);

    if (!designation) {
      throw new NotFoundException("Designação não encontrada");
    }

    return responseHandler.success(designation.toJson());
  } catch (error) {
    return responseHandler.error(error);
  }
};
