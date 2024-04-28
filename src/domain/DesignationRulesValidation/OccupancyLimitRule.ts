import { Designation } from "domain/Designation";
import { ValidationPlugin } from "./ValidationPlugin";
import { BadRequestException } from "../../shared/Exception";

export class OccupancyLimitRule implements ValidationPlugin {
  validate(designation: Designation): void {
    designation.assignments.forEach((assignment) => {
      if (assignment.participants.length > assignment.config.max) {
        console.log(assignment.participants.length, assignment.config.max)
        throw new BadRequestException("O ponto não pode ter mais participantes do que o limite de ocupação");
      }
    })
  }
}
