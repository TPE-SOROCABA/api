import type { APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../../shared/ResponseHandler";
import { connectToDatabase } from "../../../infra/connectToDatabase";
import { IncidentHistoryModel } from "../../../repositories/models/IncidentHistoryModel";

export const handler: Handler = async (_event: APIGatewayProxyEventV2 & { requestContext: { authorizer: { principalId: string } } }): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();
    const result = await IncidentHistoryModel.find()
    return ResponseHandler.success(result);
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
