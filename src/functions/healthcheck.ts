import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import mongoose from "mongoose";
import { connectToDatabase } from "../infra/connectToDatabase";

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  await connectToDatabase()
  return {
    body: JSON.stringify({ 
      database: {
        status: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      },
      whats_app: {
        status: "???",
      }
    }),
    statusCode: 200,
  };
};
