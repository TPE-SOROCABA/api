import { Designation } from "domain/Designation";
import { ValidationPlugin } from "./ValidationPlugin";
import { BadRequestException } from "../../shared/Exception";

export class ParticipantsNotAloneRule implements ValidationPlugin {
  validate(designation: Designation): void {
    let count = 0;
    designation.assignments.forEach((assignment) => {
      if (assignment.participants.length === 1) {
        assignment.error = `O ponto ${assignment.point.name} não pode ter apenas um participante`;
        count++;
      } else {
        assignment.error = "";
      }
    });
    if (count) throw new BadRequestException("O ponto não pode ter apenas um participante");
  }
}
