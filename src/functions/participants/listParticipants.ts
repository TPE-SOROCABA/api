import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { ParticipantProfile } from "../../enums/ParticipantProfile";
import { prisma } from "../../infra/prismaClient";
import { DesignationStatus } from "@prisma/client";

interface IncidentOutput {
  id: string;
  reason: string;
  status: string;
}

interface ParticipantOutput {
  id: string;
  name: string;
  phone: string;
  profile_photo: string;
  profile: ParticipantProfile;
  incident_history: IncidentOutput | null;
}

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
 const responseHandler = new ResponseHandler(_event);
  try {
    const query = _event.queryStringParameters as { filter: string };
    const groupId = _event.queryStringParameters?.groupId;

    if (!groupId) {
      return responseHandler.error("Group id is required");
    }

    const participants = await prisma.participantsGroups.findMany({
      where: {
        groupId,
        ...(query?.filter && {
          AND: {
            participant: {
              computed: {
                contains: query.filter,
                mode: "insensitive",
              },
            },
          },
        }),
      },
      include: {
        participant: {
          include: {
            IncidentParticipant: {
              where: {
                designation: {
                  groupId: groupId,
                  status: {
                    not: DesignationStatus.ARCHIVED,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
      },
    });

    const participantsOutput = participants.map((participant) => {
      const [incidentHistory] = participant.participant.IncidentParticipant;
      const incidentHistoryOutput: IncidentOutput | null = incidentHistory
        ? {
            id: incidentHistory.id,
            reason: incidentHistory.reason,
            status: incidentHistory.status,
          }
        : null;
      const participantOutput: ParticipantOutput = {
        id: participant.participant.id,
        name: participant.participant.name,
        phone: participant.participant.phone,
        profile_photo: participant.participant.profile_photo || "",
        profile: participant.participant.profile as ParticipantProfile,
        incident_history: incidentHistoryOutput,
      };
      return participantOutput;
    });

    return responseHandler.success(participantsOutput);
  } catch (error) {
    return responseHandler.error(error);
  }
};
