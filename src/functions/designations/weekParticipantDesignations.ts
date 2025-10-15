import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { BadRequestException, Exception } from "../../shared/Exception";
import { IncidentStatus } from "../../enums/IncidentStatus";
import { DesignationRepository } from "../../repositories/DesignationRepository";
import { prisma } from "../../infra/prismaClient";
import { DesignationStatus, ParticipantGroupProfile, ParticipantProfile } from "@prisma/client";
import { FakeImage } from "../../shared/FakeImage";

const designationRepository = new DesignationRepository();

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  const responseHandler = new ResponseHandler(_event);
  try {
    const participantId = _event.pathParameters?.participantId;
    const designationId = _event.pathParameters?.designationId;

    if (!participantId || !designationId) {
      throw new BadRequestException("Parâmetros inválidos");
    }

    const designation = await designationRepository.findByDesignationId(designationId);

    if (!designation) {
      throw new Exception(404, "Designação não encontrada");
    }

    if (designation.status !== DesignationStatus.CLOSED && designation.status !== DesignationStatus.IN_PROGRESS) {
      return responseHandler.success([]);
    }

    designation.assignments = designation.assignments.filter((a) => a.participants.some((p) => p.id === participantId));

    const participant = await prisma.participants.findUnique({
      where: {
        id: participantId,
      },
      include: {
        IncidentParticipant: {
          where: {
            designationId: designationId,
          },
          select: {
            id: true,
            reason: true,
            status: true,
          },
        },
        ParticipantsGroup: {
          where: {
            groupId: designation.group.id,
          }
        },
      },
    });

    if (!participant) {
      throw new Exception(404, "Participante não encontrado");
    }

    if (!participant.ParticipantsGroup || participant.ParticipantsGroup.length === 0) {
      throw new Exception(400, "Participante não está associado ao grupo");
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
      [designation].map((d) => {
        // Segurança: verificar se assignments existe e não está vazio
        const firstAssignment = d.assignments && d.assignments.length > 0 ? d.assignments[0] : null;
        const assignments = firstAssignment ? {
          point: firstAssignment.point.name,
          publication_carts: firstAssignment.publication_carts.map((p) => p.name),
          participants: firstAssignment.participants.map((p) => ({ name: p.name, profile_photo: FakeImage(p).profile_photo })),
        } : null;

        const isParticipantAssigned = d.assignments.some((a) => a.participants.some((p) => p.id === participantId));
        
        // Segurança: verificar se IncidentParticipant existe e não está vazio
        const incident = participant.IncidentParticipant && participant.IncidentParticipant.length > 0 
          ? participant.IncidentParticipant[0] 
          : null;
        const status = incident ? incident.status : IncidentStatus.CLOSED;

        let details =
          Boolean(status == IncidentStatus.OPEN) || !isParticipantAssigned
            ? {
              point: "Sem designação",
              participants: {
                name: participant.name,
                profile_photo: FakeImage(participant).profile_photo,
              },
              publication_carts: [],
            }
            : assignments ? {
              point: assignments.point,
              participants: assignments.participants,
              publication_carts: assignments.publication_carts,
            } : {
              point: "Sem designação",
              participants: {
                name: participant.name,
                profile_photo: FakeImage(participant).profile_photo,
              },
              publication_carts: [],
            };

        // Segurança: verificar se ParticipantsGroup existe antes de acessar
        const participantGroup = participant.ParticipantsGroup[0]; // Já validamos que existe acima
        if (participantGroup.profile == ParticipantGroupProfile.CAPTAIN || participantGroup.profile == ParticipantGroupProfile.ASSISTANT_CAPTAIN) {
          const captais = d.participants.filter((p) => p.profile == ParticipantProfile.CAPTAIN || p.profile == ParticipantProfile.COORDINATOR);
          details = {
            point: "Capitães",
            participants: captais.map((p) => ({ name: p.name, profile_photo: FakeImage(p).profile_photo })),
            publication_carts: [],
          };
        }

        return {
          event: eventDay?.eventDay.name ? `${eventDay?.eventDay.name} - ${d.group.name}` : d.group.name,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          expirationDate: d.getNextDate(),
          ...details,
          incident_history: incident
            ? {
              id: incident.id,
              reason: incident.reason,
              status: incident.status,
            }
            : null,
          status: d.status,
        };
      })
    );
  } catch (error) {
    return responseHandler.error(error);
  }
};
