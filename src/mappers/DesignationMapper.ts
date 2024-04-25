import { DesignationStatus } from "@prisma/client";
import { Designation, Participant, Assignments } from "../domain/Designation";
import { IDesignationModel } from "../functions/designations/interfaces/IDesignationModel";

export abstract class DesignationMapper {
  static toDomain(designationModel: IDesignationModel): Designation {
    const participants: Participant[] = designationModel.group.ParticipantsGroup.map((participant) => {
      const [incidentHistory] = participant.participant.IncidentParticipant.map((incident: any) => {
        return {
          id: incident.id,
          reason: incident.reason,
          status: incident.status,
        };
      });
      return {
        id: participant.participant.id,
        name: participant.participant.name,
        cpf: participant.participant.cpf,
        phone: participant.participant.phone,
        profile_photo: participant.participant.profile_photo,
        sex: participant.participant.sex as any,
        incident_history: incidentHistory || null,
        profile: participant.participant.profile as any,
      };
    });

    const assignments: Assignments[] = designationModel.assignments.map((assignment) => {
      return {
        id: assignment.id,
        point: {
          id: assignment.point.id,
          name: assignment.point.name,
          status: assignment.config_status,
        },
        publication_carts: assignment.AssignmentsPublicationCart.map((publicationCart) => {
          return {
            id: publicationCart.publicationCart.id,
            name: publicationCart.publicationCart.name,
          };
        }),
        participants:
          assignment.AssignmentsParticipants.map((participant) => {
            const participantIndex = participants.findIndex((p) => p.id === participant.participant.id);
            if (participantIndex !== -1) participants.splice(participantIndex, 1);
            const [incidentHistory] = participant.participant.IncidentParticipant.map((incident: any) => {
              return {
                id: incident.id,
                reason: incident.reason,
                status: incident.status,
              };
            });
            return {
              id: participant.participant.id,
              name: participant.participant.name,
              cpf: participant.participant.cpf,
              phone: participant.participant.phone,
              profile_photo: participant.participant.profile_photo,
              sex: participant.participant.sex as any,
              incident_history: incidentHistory || null,
              profile: participant.participant.profile as any,
            };
          }) || [],
        config: {
          max: assignment.config_max,
          min: assignment.config_min,
        },
      };
    });
    const designation = new Designation(
      designationModel.id,
      {
        config: {
          weekday: designationModel.group.config_weekday as any,
          startHour: designationModel.group.config_start_hour,
          endHour: designationModel.group.config_end_hour,
          minParticipants: designationModel.group.config_min,
          maxParticipants: designationModel.group.config_max,
        },
        id: designationModel?.group.id,
        name: designationModel?.group.name,
      },
      designationModel.status as DesignationStatus,
      assignments,
      participants,
      designationModel?.createdAt,
      designationModel?.updatedAt
    );

    designation.mandatoryPresence = designationModel.mandatoryPresence;
    designation.cancellationJustification = designationModel?.cancellationJustification || ""

    return designation;
  }
}
