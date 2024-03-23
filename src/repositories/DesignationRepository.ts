import { FilterQuery } from "mongoose";
import { Designation } from "../domain/Designation";
import { DesignationStatus } from "../enums/DesignationStatus";
import { IDesignationModel } from "../functions/designations/interfaces/IDesignationModel";
import { connectToDatabase } from "../infra/connectToDatabase";
import { DesignationMapper } from "../mappers/DesignationMapper";
import { Exception } from "../shared/Exception";
import { DesignationModel, IDesignation } from "./models/DesignationModel";
import { EventDayModel } from "./models/EventDayModel";
import { GroupModel } from "./models/GroupModel";
import { ParticipantModel } from "./models/ParticipantModel";
import { PointModel } from "./models/PointModel";
import { PublicationCartModel } from "./models/PublicationCartModel";
import { IncidentHistoryModel } from "./models/IncidentHistoryModel";

export class DesignationRepository {
  async findOne(groupId: string): Promise<Designation> {
    await connectToDatabase();
    const designationModel = await DesignationModel.findOne<IDesignationModel>({ group: groupId, status: DesignationStatus.OPEN })
      .populate({
        path: "participants",
        model: ParticipantModel,
        populate: {
          path: "incident_history",
          model: IncidentHistoryModel,
        },
      })
      .populate({
        path: "assignments.point",
        model: PointModel,
      })
      .populate({
        path: "assignments.publication_carts",
        model: PublicationCartModel,
      })
      .populate({
        path: "assignments.participants",
        model: ParticipantModel,
      })
      .populate({
        path: "group",
        model: GroupModel,
        populate: [
          {
            path: "participants",
            model: ParticipantModel,
            populate: {
              path: "incident_history",
              model: IncidentHistoryModel,
            },
          },
          {
            path: "event_day",
            model: EventDayModel,
          },
        ],
      });

    if (!designationModel) {
      throw new Exception(404, "Designação não encontrada");
    }

    return DesignationMapper.toDomain(designationModel);
  }

  async findAll(groupId: string, filter?: { createdAt: Date }): Promise<Designation[]> {
    await connectToDatabase();
    const filterQuery: FilterQuery<IDesignation> = filter?.createdAt ? { createdAt: { $gte: filter.createdAt } } : {};
    const designationsModel = await DesignationModel.find<IDesignationModel>({
      group: groupId,
      ...filterQuery,
    })
      .populate({
        path: "participants",
        model: ParticipantModel,
        populate: {
          path: "incident_history",
          model: IncidentHistoryModel,
        },
      })
      .populate({
        path: "assignments.point",
        model: PointModel,
      })
      .populate({
        path: "assignments.publication_carts",
        model: PublicationCartModel,
      })
      .populate({
        path: "assignments.participants",
        model: ParticipantModel,
      })
      .populate({
        path: "group",
        model: GroupModel,
        populate: [
          {
            path: "participants",
            model: ParticipantModel,
            populate: {
              path: "incident_history",
              model: IncidentHistoryModel,
            },
          },
          {
            path: "event_day",
            model: EventDayModel,
          },
        ],
      })
      .sort({ createdAt: -1 });

    return designationsModel.map((designationModel) => DesignationMapper.toDomain(designationModel));
  }

  async findByDesignationId(designationId: string): Promise<Designation> {
    await connectToDatabase();
    const designationModel = await DesignationModel.findById<IDesignationModel>(designationId)
      .populate({
        path: "participants",
        model: ParticipantModel,
        populate: {
          path: "incident_history",
          model: IncidentHistoryModel,
        },
      })
      .populate({
        path: "assignments.point",
        model: PointModel,
      })
      .populate({
        path: "assignments.publication_carts",
        model: PublicationCartModel,
      })
      .populate({
        path: "assignments.participants",
        model: ParticipantModel,
      })
      .populate({
        path: "group",
        model: GroupModel,
        populate: [
          {
            path: "participants",
            model: ParticipantModel,
            populate: {
              path: "incident_history",
              model: IncidentHistoryModel,
            },
          },
          {
            path: "event_day",
            model: EventDayModel,
          },
        ],
      });

    if (!designationModel) {
      throw new Exception(404, "Designação não encontrada");
    }

    return DesignationMapper.toDomain(designationModel);
  }
}
