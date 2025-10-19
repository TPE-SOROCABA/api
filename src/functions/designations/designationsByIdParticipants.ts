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

    // Filtra participantes não designados que são capitães ou coordenadores
    const unassignedCaptains = designation.participants.filter((participant) => {
      // Verifica se NÃO está designado em nenhum ponto
      const isAssigned = designation.assignments.some((assignment) =>
        assignment.participants.some((p) => p.id === participant.id)
      );

      // Verifica se é capitão ou coordenador
      const isCaptainOrCoordinator = participant.profile === "CAPTAIN" || participant.profile === "COORDINATOR";

      return !isAssigned && isCaptainOrCoordinator;
    });

    return responseHandler.success([
      // Se há capitães/coordenadores não designados, cria uma única entrada agrupada
      ...(unassignedCaptains.length > 0 ? [{
        event: eventDay?.eventDay.name ? `${eventDay?.eventDay.name} - ${designation.group.name}` : designation.group.name,
        createdAt: designation.createdAt,
        updatedAt: designation.updatedAt,
        expirationDate: designation.getNextDate(),
        point: "Capitães",
        participants: unassignedCaptains.map((participant) => ({
          name: participant.name,
          profile_photo: participant.profile_photo
        })),
        publication_carts: [],
        status: designation.status,
      }] : []),
      ...designation.assignments.map((assignment) => {
        const assignmentData = {
          point: assignment.point.name,
          publication_carts: assignment.publication_carts.map((p) => p.name),
          participants: assignment.participants.map((p) => ({
            name: p.name,
            profile_photo: p.profile_photo,
          })),
        };

        return {
          event: eventDay?.eventDay.name ? `${eventDay?.eventDay.name} - ${designation.group.name}` : designation.group.name,
          createdAt: designation.createdAt,
          updatedAt: designation.updatedAt,
          expirationDate: designation.getNextDate(),
          point: assignmentData.point,
          participants: assignmentData.participants,
          publication_carts: assignmentData.publication_carts,
          status: designation.status,
        };
      })
    ]);
  } catch (error) {
    return responseHandler.error(error);
  }
};
