import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { CreateDesignationUseCase } from "../../services/CreateDesignationUseCase";

const createDesignationUseCase = new CreateDesignationUseCase();

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const groupId = _event.queryStringParameters?.groupId;
    if (!groupId) {
      return ResponseHandler.error({ message: "Parâmetros inválidos" });
    }

    await createDesignationUseCase.execute(groupId);

    return ResponseHandler.success({ message: "Designação criada com sucesso!" });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
