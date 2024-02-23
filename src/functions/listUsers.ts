import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../shared/ResponseHandler";
import { User } from "../repositories/models/User";
import { connectToDatabase } from "../infra/connectToDatabase";

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();
    
    const users = await User.find();
    
    return ResponseHandler.success(users);
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
