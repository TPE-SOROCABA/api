import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { BadRequestException, Exception } from "../../shared/Exception";
import { ParticipantSex } from "../../enums/ParticipantSex";
import { IncidentStatus } from "../../enums/IncidentStatus";
import { DesignationRepository } from "../../repositories/DesignationRepository";
import { prisma } from "../../infra/prismaClient";
import { DesignationStatus, ParticipantProfile } from "@prisma/client";

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
          select: {
            reason: true,
            status: true,
          },
        },
      },
    });

    if (!participant) {
      throw new Exception(404, "Participante não encontrado");
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
        const sexEmoticon = (sex: ParticipantSex) => (sex === ParticipantSex.MALE ? "🧑🏻‍💼" : "👩🏻‍💼");

        const [assignments] = d.assignments.map((a) => ({
          point: a.point.name,
          publication_carts: a.publication_carts.map((p) => p.name),
          participants: a.participants.map((p) => `${p.name}(${sexEmoticon(p.sex as unknown as ParticipantSex)})`),
        }));

        const isParticipantAssigned = d.assignments.some((a) => a.participants.some((p) => p.id === participantId));
        const [incident] = participant?.IncidentParticipant;
        const status = incident ? incident.status : IncidentStatus.CLOSED;

        let details =
          Boolean(status == IncidentStatus.OPEN) || !isParticipantAssigned
            ? {
                point: "Sem designação",
                participants: [`${participant.name} (${sexEmoticon(participant.sex as unknown as ParticipantSex)})`],
                publication_carts: [],
              }
            : {
                point: assignments.point,
                participants: assignments.participants,
                publication_carts: assignments.publication_carts,
              };

        if (participant.profile == ParticipantProfile.CAPTAIN || participant.profile == ParticipantProfile.COORDINATOR) {
          const captais = d.participants.filter((p) => p.profile == ParticipantProfile.CAPTAIN || p.profile == ParticipantProfile.COORDINATOR);
          details = {
            point: "Visitas de Encorajamento",
            participants: captais.map((p) => `${p.name} (${sexEmoticon(p.sex as unknown as ParticipantSex)})`),
            publication_carts: [],
          };
        }

        return {
          event: `${eventDay?.eventDay.name} - ${d.group.name}`,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          expirationDate: d.getNextDate(),
          ...details,
          incident_history: incident
            ? {
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
