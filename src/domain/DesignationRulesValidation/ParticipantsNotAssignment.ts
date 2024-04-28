import { Designation } from "domain/Designation";
import { ValidationPlugin } from "./ValidationPlugin";
import { BadRequestException } from "../../shared/Exception";
import { ParticipantProfile } from "../../enums/ParticipantProfile";

export class ParticipantsNotAssignment implements ValidationPlugin {
  validate(designation: Designation): void {
    designation.participants.forEach((participant) => {
      if (participant.incident_history) return;
      if (participant.profile === ParticipantProfile.CAPTAIN) return
      if (participant.profile === ParticipantProfile.COORDINATOR) return

      throw new BadRequestException("Não pode haver participantes sem atribuição");
    });
  }
}