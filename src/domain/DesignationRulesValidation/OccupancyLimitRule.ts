import { Designation } from "domain/Designation";
import { ValidationPlugin } from "./ValidationPlugin";
import { BadRequestException } from "../../shared/Exception";

export class OccupancyLimitRule implements ValidationPlugin {
  validate(designation: Designation): void {
    let count = 0;
    designation.assignments.forEach((assignment) => {
      if (assignment.participants.length > assignment.config.max) {
        assignment.error = `O ponto ${assignment.point.name} não pode ter mais participantes do que o limite de ocupação`;
        count++;
      } else {
        assignment.error = "";
      }
    });
    if (count) throw new BadRequestException("O ponto não pode ter mais participantes do que o limite de ocupação");
  }
}
