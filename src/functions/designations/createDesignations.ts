import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { DesignationStatus } from "../../enums/DesignationStatus";
import { prisma } from "../../infra/prismaClient";

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const groupId = _event.queryStringParameters?.groupId;
    if (!groupId) {
      return ResponseHandler.error({ message: "Parâmetros inválidos" });
    }

    const group = await prisma.groups.findFirst({
      where: {
        id: groupId,
      },
    });

    if (!group) {
      return ResponseHandler.error({ message: "Grupo não encontrado" });
    }

    const pointPublicationCart = await prisma.pointPublicationCart.findMany({
      where: {
        groupId,
      },
    });

    const pointsIds = pointPublicationCart
      .map((point) => point.pointId)
      .reduce((acc, cur) => {
        if (!acc.includes(cur)) {
          acc.push(cur);
        }
        return acc;
      }, [] as string[]);

    const designation = await prisma.designations.create({
      data: {
        name: `Designação ${group.name}`,
        groupId,
        status: DesignationStatus.OPEN,
      },
    });

    for (const point of pointsIds) {
      const assignments = await prisma.assignments.create({
        data: {
          designationsId: designation.id,
          pointId: point,
          config_max: pointPublicationCart.find((pointPublicationCart) => pointPublicationCart.pointId === point)?.maxParticipants!,
          config_min: pointPublicationCart.find((pointPublicationCart) => pointPublicationCart.pointId === point)?.minParticipants!,
          config_status: pointPublicationCart.find((pointPublicationCart) => pointPublicationCart.pointId === point)?.status!,
        },
      });

      const pointAssignments = pointPublicationCart.filter((pointPublicationCart) => pointPublicationCart.pointId === point);
      for (const pointAssignment of pointAssignments) {
        await prisma.assignmentsPublicationCart.create({
          data: {
            assignmentId: assignments.id,
            publicationCartId: pointAssignment.publicationCartId,
          },
        });
      }
    }

    return ResponseHandler.success({ message: "Designação criada com sucesso!" });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
