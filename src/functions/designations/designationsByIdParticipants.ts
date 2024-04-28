import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { BadRequestException, Exception } from "../../shared/Exception";
import { ParticipantSex } from "../../enums/ParticipantSex";
import { DesignationRepository } from "../../repositories/DesignationRepository";
import { prisma } from "../../infra/prismaClient";
import { DesignationStatus, IncidentStatus } from "@prisma/client";

const designationRepository = new DesignationRepository();

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  const responseHandler = new ResponseHandler(_event);
  try {
    const designationId = _event.pathParameters?.designationId;

    if (!designationId) {
      throw new BadRequestException("Parâmetros inválidos");
    }

    const designation = await designationRepository.findByDesignationId(designationId);

    if (!designation) {
      throw new Exception(404, "Designação não encontrada");
    }

    if (designation.status !== DesignationStatus.IN_PROGRESS) {
      return responseHandler.success([]);
    }

    const eventDay = await prisma.eventDayGroups.findFirst({
      where: {
        groupId: designation.group.id,
      },
      include: {
        eventDay: true,
      },
    });

    return responseHandler.success(
      designation.assignments.map((assignment) => {

        const assignmentData = {
          point: assignment.point.name,
          publication_carts: assignment.publication_carts.map((p) => p.name),
          participants: assignment.participants.map((p) => ({
            name: p.name,
            profile_photo: p.profile_photo,
          })),
        };

        return {
          event: `${eventDay?.eventDay.name} - ${designation.group.name}`,
          createdAt: designation.createdAt,
          updatedAt: designation.updatedAt,
          expirationDate: designation.getNextDate(),
          point: assignmentData.point,
          participants: assignmentData.participants,
          publication_carts: assignmentData.publication_carts,
          status: designation.status,
        };
      })
    );
  } catch (error) {
    return responseHandler.error(error);
  }
};
