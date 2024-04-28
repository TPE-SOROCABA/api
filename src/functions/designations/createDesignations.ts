import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { CreateDesignationUseCase } from "../../services/CreateDesignationUseCase";
import { BadRequestException } from "shared/Exception";

const createDesignationUseCase = new CreateDesignationUseCase();

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
 const responseHandler = new ResponseHandler(_event);
  try {
    const groupId = _event.queryStringParameters?.groupId;
    if (!groupId) {
      throw new BadRequestException("Parâmetros inválidos");
    }

    await createDesignationUseCase.execute(groupId);

    return responseHandler.success({ message: "Designação criada com sucesso!" });
  } catch (error) {
    return responseHandler.error(error);
  }
};
