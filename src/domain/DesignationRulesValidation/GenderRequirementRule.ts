import { Assignments, Designation } from "domain/Designation";
import { ValidationPlugin } from "./ValidationPlugin";
import { BadRequestException } from "../../shared/Exception";

export class GenderRequirementRule implements ValidationPlugin {
  validate(designation: Designation): void {
    let count = 0;
    designation.assignments.forEach((assignment) => {
      if (!this.validateGenderAssignment(assignment)) {
        const message = `O ponto ${assignment.point.name} não pode ter 2 participantes de sexos diferentes`;
        assignment.error = message;
        count++;
      } else {
        assignment.error = "";
      }
    });
    if (count) throw new BadRequestException("O ponto não pode ter 2 participantes de sexos diferentes");
  }

  validateGenderAssignment(assignment: Assignments): boolean {
    const genders = assignment.participants.map((p) => p.sex);
    if (genders.length === 2) {
      return genders[0] === genders[1];
    }

    return true;
  }
}
