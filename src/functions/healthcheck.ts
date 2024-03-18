import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  const list = Object.keys(process.env);
  const envs = list.reduce((acc:any, key:any) => {
    acc[key] = process.env[key];
    return acc;
  },{});
  console.log(envs);
  return {
    body: JSON.stringify({ message: "Healthcheck OK" }),
    statusCode: 200,
  };
};
