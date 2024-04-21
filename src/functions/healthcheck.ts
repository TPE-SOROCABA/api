import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  return {
    body: JSON.stringify({
      database: {
        status: "connected",
      },
      whats_app: {
        status: "???",
      },
    }),
    statusCode: 200,
  };
};
