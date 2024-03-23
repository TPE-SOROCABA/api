import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { connectToDatabase } from "../../infra/connectToDatabase";
import { DesignationRepository } from "../../repositories/DesignationRepository";

const designationRepository = new DesignationRepository();

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();
    const groupId = _event.queryStringParameters?.groupId;
    const date = _event.queryStringParameters?.date as string
    if (!groupId) {
      return ResponseHandler.error({ message: "Parâmetros inválidos" });
    }
    const designations = await designationRepository.findAll(groupId, { createdAt: new Date(date)});
    
    return ResponseHandler.success(designations);
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
