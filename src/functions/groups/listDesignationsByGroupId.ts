import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { prisma } from "infra/prismaClient";
import { BadRequestException } from "shared/Exception";
import dayjs from "dayjs";

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
 const responseHandler = new ResponseHandler(_event);
  try {
    const dateFrom = _event.queryStringParameters?.dateFrom;
    const dateTo = _event.queryStringParameters?.dateTo;
    const groupId = _event.pathParameters?.groupId;
    if (!groupId) {
      throw new BadRequestException("Paramêtro groupId é obrigatório");
    }

    if (!dayjs(dateFrom).isValid() || !dayjs(dateTo).isValid()) {
      throw new BadRequestException("Parâmetros de data devem estar no formato YYYY-MM-DD");
    }

    const isFilterByDate = dateFrom && dateTo;

    const designations = await prisma.designations.findMany({
      where: {
        groupId: groupId,
        ...(isFilterByDate && {
          designationDate: {
            gte: dayjs(dateFrom + "00:00").toDate(),
            lte: dayjs(dateTo + "23:59").toDate(),
          },
        }),
      },
      orderBy: {
        designationDate: "desc",
      },
      take: 10,
    });

    return responseHandler.success(designations);
  } catch (error) {
    return responseHandler.error(error);
  }
};
