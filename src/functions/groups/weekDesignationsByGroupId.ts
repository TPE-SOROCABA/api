import { DesignationRepository } from "../../repositories/DesignationRepository";
import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { SendUpdateDesignation } from "../../services/SendUpdateDesignation";
import { BadRequestException } from "shared/Exception";

const designationRepository = new DesignationRepository();
const sendUpdateDesignation = new SendUpdateDesignation();

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const groupId = _event.pathParameters?.groupId;
    const random = _event.queryStringParameters?.random;
    const filter = _event.queryStringParameters?.filter;
    if (!groupId) {
      throw new BadRequestException("Parâmetros inválidos");
    }
    console.time("Designation");
    const designation = await designationRepository.findOne(groupId);
    console.timeEnd("Designation");
    if (random) {
      designation.generateAssignment();
      await sendUpdateDesignation.execute(designation);
    }

    if (filter) {
      designation.filterAssignment(filter);
    }

    return ResponseHandler.success(designation);
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
