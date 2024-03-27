import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { DesignationRepository } from "../../repositories/DesignationRepository";
import { DesignationModel } from "../../repositories/models/DesignationModel";
import { DesignationMapper } from "../../mappers/DesignationMapper";

const designationRepository = new DesignationRepository();

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const groupId = _event.queryStringParameters?.groupId;
    const random = _event.queryStringParameters?.random;
    const filter = _event.queryStringParameters?.filter;
    if (!groupId) {
      return ResponseHandler.error({ message: "Parâmetros inválidos" });
    }

    const designation = await designationRepository.findOne(groupId);

    if (random) {
      designation.generateAssignment();
      await DesignationModel.updateOne({ _id: designation.id }, DesignationMapper.toPersistence(designation));
    }

    if (filter) {
      designation.filterAssignment(filter);
    }


    return ResponseHandler.success(designation);
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
