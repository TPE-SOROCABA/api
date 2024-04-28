import { Designation } from "domain/Designation";
import { ValidationPlugin } from "./ValidationPlugin";
import { BadRequestException } from "../../shared/Exception";

export class ParticipantsNotAloneRule implements ValidationPlugin {
  validate(designation: Designation): void {
    designation.assignments.forEach((assignment) => {
      if (assignment.participants.length === 1) {
        throw new BadRequestException("O ponto não pode ter apenas um participante");
      }
    })
  }
}