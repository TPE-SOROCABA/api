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

    return ResponseHandler.success(designation.map((d) => {
      const [participant] = d.participants.filter((p) => p._id.toString() === participantId)
      const sexEmoticon = (sex: ParticipantSex) => (sex === ParticipantSex.MALE ? "🧑🏻‍💼" : "👩🏻‍💼");
      return {
        event: `${d.designation.group.event_day.name} | ${d.designation.group.name}` ,
        point: d.point.name,
        publicationCarts: d.publication_carts.map((c) => c.name),
        participants: d.participants.map((p) => `${p.name}(${sexEmoticon(p.sex)})`),
        createdAt: d.designation.createdAt,
        updatedAt: d.designation.updatedAt,
        expirationDate: d.expirationDate,
        incidentHistory: participant ? {  
          reason: participant.incident_history?.reason,
          status: participant.incident_history?.status 
        } : null,
      }
    }));
  } catch (error) {
    return ResponseHandler.error(error);
  }
};

async function getWeekDesignationParticipant(participantId: string): Promise<IWeekDesignationModel[]> {
  return WeekDesignationModel.find({
    participants: {
      $in: [new Types.ObjectId(participantId)],
    },
  })
    .populate({
      path: "point",
      select: "name",
      model: PointModel,
    })
    .populate({
      path: "publication_carts",
      select: "name",
      model: PublicationCartModel,
    })
    .populate({
      path: "participants",
      select: ["name", "incident_history", "sex"],
      model: ParticipantModel,
      populate: {
        path: "incident_history",
        model: IncidentHistoryModel,
      },
    })
    .populate({
      path: "designation",
      model: DesignationModel,
      select: ["group", "createdAt", "updatedAt"],
      populate: {
        path: "group",
        model: GroupModel,
        select: ["name", "config", "event_day"],
        populate: {
          path: "event_day",
          model: EventDayModel,
          select: "name",
        },
      },
    });
}

