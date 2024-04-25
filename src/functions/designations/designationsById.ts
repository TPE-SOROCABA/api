import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { Exception } from "../../shared/Exception";
import { ParticipantSex } from "../../enums/ParticipantSex";
import { DesignationRepository } from "../../repositories/DesignationRepository";
import { prisma } from "../../infra/prismaClient";
import { DesignationStatus, IncidentStatus } from "@prisma/client";

const designationRepository = new DesignationRepository();

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const designationId = _event.pathParameters?.designationId;

    if (!designationId) {
      return ResponseHandler.error({ message: "Parâmetros inválidos" });
    }

    const designation = await designationRepository.findByDesignationId(designationId);

    if (!designation) {
      throw new Exception(404, "Designação não encontrada");
    }

    if (designation.status !== DesignationStatus.IN_PROGRESS) {
      return ResponseHandler.success([]);
    }

    const eventDay = await prisma.eventDayGroups.findFirst({
      where: {
        groupId: designation.group.id,
      },
      include: {
        eventDay: true,
      },
    });

    return ResponseHandler.success(
      designation.assignments.map((assignment) => {
        const sexEmoticon = (sex: ParticipantSex) => (sex === ParticipantSex.MALE ? "🧑🏻‍💼" : "👩🏻‍💼");

        const assignmentData = {
          point: assignment.point.name,
          publication_carts: assignment.publication_carts.map((p) => p.name),
          participants: assignment.participants.map((p) => `${p.name}(${sexEmoticon(p.sex as unknown as ParticipantSex)})`),
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
    return ResponseHandler.error(error);
  }
};
