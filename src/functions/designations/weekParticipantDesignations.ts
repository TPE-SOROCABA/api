import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { connectToDatabase } from "../../infra/connectToDatabase";
import { WeekDesignationModel } from "../../repositories/models/WeekDesignationModel";
import { Types } from "mongoose";
import { PointModel } from "../../repositories/models/PointModel";
import { PublicationCartModel } from "../../repositories/models/PublicationCartModel";
import { ParticipantModel } from "../../repositories/models/ParticipantModel";
import { DesignationModel } from "../../repositories/models/DesignationModel";
import { GroupModel } from "../../repositories/models/GroupModel";
import { EventDayModel } from "../../repositories/models/EventDayModel";
import { IWeekDesignationModel } from "./interfaces/IWeekDesignationModel";
import { Exception } from "../../shared/Exception";
import { IncidentHistoryModel } from "../../repositories/models/IncidentHistoryModel";
import { ParticipantSex } from "../../enums/ParticipantSex";
import { DesignationStatus } from "../../enums/DesignationStatus";
import { IncidentStatus } from "../../enums/IncidentStatus";

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();
    const participantId = _event.pathParameters?.participantId;

    if (!participantId) {
      return ResponseHandler.error({ message: "Parâmetros inválidos" });
    }

    const designation = await getWeekDesignationParticipant(participantId);

    if (!designation.length) {
      throw new Exception(404, "Designação não encontrada");
    }

    const designationParticipant = designation.filter((d) => d.designation.assignments.some((a) => a.participants.some((p) => p._id.toString() === participantId)));

    designationParticipant.forEach((d) => {
      d.designation.assignments = d.designation.assignments.filter((a) => a.participants.some((p) => p._id.toString() === participantId));
    });

    return ResponseHandler.success(designation.map((d) => {
      const sexEmoticon = (sex: ParticipantSex) => (sex === ParticipantSex.MALE ? "🧑🏻‍💼" : "👩🏻‍💼");

      const [assignments] = d.designation.assignments.map(a => ({
        point: a.point.name,
        publication_carts: a.publication_carts.map((p) => p.name),
        participants: a.participants.map((p) => `${p.name}(${sexEmoticon(p.sex as unknown as ParticipantSex)})`)
      }))

      const isParticipantAssigned = d.designation.assignments.some((a) => a.participants.some((p) => p._id.toString() === participantId));

      const status = d.participant?.incident_history ? d.participant.incident_history.status : IncidentStatus.CLOSED;
      const details = (Boolean(status == IncidentStatus.OPEN) && !isParticipantAssigned) ? {
        point: "Sem designação",
        participants: [`${d.participant.name}(${sexEmoticon(d.participant.sex as unknown as ParticipantSex)})`],
        publication_carts: [],
      } : {
        point: assignments.point,
        participants: assignments.participants,
        publication_carts: assignments.publication_carts,
      }
      
      return {
        event: `${d.designation.group.event_day.name} | ${d.designation.group.name}` ,
        createdAt: d.designation.createdAt,
        updatedAt: d.designation.updatedAt,
        expirationDate: d.expirationDate,
        ...details,
        incident_history: d.participant.incident_history ? {
          reason: d.participant.incident_history.reason,
          status: d.participant.incident_history.status
        } : null,
      }
    }));
  } catch (error) {
    return ResponseHandler.error(error);
  }
};

async function getWeekDesignationParticipant(participantId: string): Promise<IWeekDesignationModel[]> {
  return WeekDesignationModel.find({
    participant: new Types.ObjectId(participantId),
  })
    .populate({
      path: "designation",
      model: DesignationModel,
      select: ["group", "createdAt", "updatedAt", "assignments"],
      populate: [
        {
          path: "group",
          model: GroupModel,
          select: ["name", "config", "event_day"],
          populate: {
            path: "event_day",
            model: EventDayModel,
            select: "name",
          },
        },
        {
          path: "assignments",
          model: "Assignment",
          select: ["point", "participants", "publication_carts"],
          populate: [
            {
              path: "point",
              model: PointModel,
              select: "name",
            },
            {
              path: "publication_carts",
              model: PublicationCartModel,
              select: "name",
            },
            {
              path: "participants",
              model: ParticipantModel,
              select: ["name", "sex"],
            },
          ],
        },
      ],
    })
    .populate({
      path: "participant",
      select: ["name", "incident_history", "sex"],
      model: ParticipantModel,
      populate: {
        path: "incident_history",
        model: IncidentHistoryModel,
      },
    });
}
