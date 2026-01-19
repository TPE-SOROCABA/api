import { DesignationStatus, ParticipantGroupProfile, ParticipantProfile, ParticipantSex } from "@prisma/client";
import { Designation, Participant, Assignments } from "../domain/Designation";
import { IDesignationModel } from "../functions/designations/interfaces/IDesignationModel";
import { GenderRequirementRule } from "domain/DesignationRulesValidation/GenderRequirementRule";
import { OccupancyLimitRule } from "domain/DesignationRulesValidation/OccupancyLimitRule";
import { ParticipantsNotAloneRule } from "domain/DesignationRulesValidation/ParticipantsNotAloneRule";
import { FakeImage } from "shared/FakeImage";

export abstract class DesignationMapper {
  static toDomain(designationModel: IDesignationModel, skipValidations = false): Designation {
    const incidentMapper = (incident: any) => {
      if (incident.designationId !== designationModel.id) return null;
      if (incident.status !== "OPEN") return null;
      return {
        id: incident.id,
        reason: incident.reason,
        status: incident.status,
      };
    }

    const participants: Participant[] = designationModel.group.ParticipantsGroup.map((participantGroup) => {
      const [incidentHistory] = participantGroup.participant.IncidentParticipant.map(incidentMapper).filter(Boolean);
      return {
        id: participantGroup.participant.id,
        name: participantGroup.participant.name,
        cpf: participantGroup.participant.cpf,
        phone: participantGroup.participant.phone,
        profile_photo: FakeImage(participantGroup.participant).profile_photo,
        sex: participantGroup.participant.sex as any,
        incident_history: incidentHistory || null,
        profile: participantGroup.profile as any,
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
          assignment.AssignmentsParticipants.map((assignmentsParticipant) => {
            const participantIndex = participants.findIndex((p) => p.id === assignmentsParticipant.participant.id);
            if (participantIndex !== -1) participants.splice(participantIndex, 1);
            const [incidentHistory] = assignmentsParticipant.participant.IncidentParticipant.map(incidentMapper).filter(Boolean);
            const groupProfile = assignmentsParticipant.participant.ParticipantsGroup.find(pg => pg.groupId === designationModel.groupId)?.profile;
            return {
              id: assignmentsParticipant.participant.id,
              name: assignmentsParticipant.participant.name,
              cpf: assignmentsParticipant.participant.cpf,
              phone: assignmentsParticipant.participant.phone,
              profile_photo: FakeImage(assignmentsParticipant.participant).profile_photo,
              sex: assignmentsParticipant.participant.sex as any,
              incident_history: incidentHistory || null,
              profile: groupProfile as any,
            };
          }) || [],
        config: {
          max: assignment.config_max,
          min: assignment.config_min,
        },
      };
    });

    const participantsNotAloneRule = new ParticipantsNotAloneRule();
    const occupancyLimitRule = new OccupancyLimitRule();
    const genderRequirementRule = new GenderRequirementRule();

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
        whatsappId: designationModel?.group.whatsappId,
        type: designationModel.group.type,
      },
      designationModel.status as DesignationStatus,
      assignments,
      participants,
      designationModel?.createdAt,
      designationModel?.updatedAt
    );

    designation.mandatoryPresence = designationModel.mandatoryPresence;
    designation.cancellationJustification = designationModel?.cancellationJustification || ""

    if (!skipValidations) {
      designation.addValidationPlugin(participantsNotAloneRule);
      designation.addValidationPlugin(occupancyLimitRule);
      designation.addValidationPlugin(genderRequirementRule);
      try {
        designation.applyValidations()
      } catch (error) {
        console.log(error)
      }
    }
    return designation;
  }
}
