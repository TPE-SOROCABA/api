import { Types } from "mongoose";
import { Designation, Group, Participant, Assignments } from "../domain/Designation";
import { IDesignationModel } from "../functions/designations/interfaces/IDesignationModel";
import { IDesignation } from "../repositories/models/DesignationModel";

export abstract class DesignationMapper {
  static toDomain(props: IDesignationModel): Designation {
    const group: Group = {
      id: props.group._id?.toString(),
      name: props.group.name,
      config: {
        startHour: props.group.config.startHour,
        endHour: props.group.config.endHour,
        weekday: props.group.config.weekday,
        minParticipants: props.group.config.min,
        maxParticipants: props.group.config.max,
      },
    };

    const participantsProps: Participant[] = props.participants
      .map((participant) => ({
        id: participant._id?.toString(),
        name: participant.name,
        phone: participant.phone,
        profile: participant.profile,
        profile_photo: participant.profile_photo,
        sex: participant.sex,
        incident_history: participant.incident_history
          ? {
              id: participant.incident_history?._id?.toString(),
              reason: participant.incident_history?.reason,
              status: participant.incident_history?.status,
            }
          : null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const assignments: Assignments[] = props.assignments
      .map((assignment) => {
        const point = {
          id: assignment.point._id?.toString(),
          name: assignment.point.name,
          status: assignment.config.status,
        };

        const publication_carts = assignment.publication_carts.map((publicationCart) => ({
          id: publicationCart._id?.toString(),
          name: publicationCart.name,
        }));

        let participants: any[] = [];
        if (assignment.config.status) {
          participants = assignment.participants.map((participant) => ({
            id: participant._id?.toString(),
            name: participant.name,
            phone: participant.phone,
            profile: participant.profile,
            profile_photo: participant.profile_photo,
            sex: participant.sex,
            incident_history: participant.incident_history
              ? {
                  id: participant.incident_history._id?.toString(),
                  reason: participant.incident_history.reason,
                  status: participant.incident_history.status,
                }
              : null,
          }));
        } else {
          participantsProps.push(
            ...assignment.participants.map((participant) => ({
              id: participant._id?.toString(),
              name: participant.name,
              phone: participant.phone,
              profile: participant.profile,
              profile_photo: participant.profile_photo,
              sex: participant.sex,
              incident_history: participant.incident_history
                ? {
                    id: participant.incident_history._id?.toString(),
                    reason: participant.incident_history.reason,
                    status: participant.incident_history.status,
                  }
                : null,
            }))
          );
        }

        return {
          point,
          publication_carts,
          participants,
          config: {
            max: assignment.config.max,
            min: assignment.config.min,
          },
        };
      })
      .sort((a, b) => a.point.name.localeCompare(b.point.name))
      .sort((a, b) => (a.point.status === b.point.status ? 0 : a.point.status ? -1 : 1));

    return new Designation(props._id?.toString(), group, props.status, assignments, participantsProps, props.createdAt, props.updatedAt);
  }

  static toPersistence(designation: Designation): IDesignation {
    const participants = designation.participants.map((participant) => new Types.ObjectId(participant.id));
    participants.push(...designation.incidents.map((incident) => new Types.ObjectId(incident.id)));
    return {
      group: new Types.ObjectId(designation.group.id),
      status: designation.status,
      assignments: designation.assignments.map((assignment) => ({
        point: new Types.ObjectId(assignment.point.id),
        publication_carts: assignment.publication_carts.map((publicationCart) => new Types.ObjectId(publicationCart.id)),
        participants: assignment.participants.map((participant) => new Types.ObjectId(participant.id)),
        config: {
          max: assignment.config.max,
          min: assignment.config.min,
          status: assignment.point.status,
        },
      })),
      participants: participants,
      createdAt: designation.createdAt,
      updatedAt: designation.updatedAt,
    };
  }
}
