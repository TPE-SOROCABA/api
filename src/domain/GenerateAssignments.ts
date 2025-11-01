import { DesignationStatus, ParticipantProfile, GroupType } from "@prisma/client";
import { Designation } from "./Designation";
import { BadRequestException } from "../shared/Exception";
import { DesignationStatusPT_BR } from "../enums/DesignationStatusPT_BR";

const randomIndex = (array: Array<number>) => Math.floor(Math.random() * array.length);

export class GenerateAssignments {
  count = 0;
  constructor(public designation: Designation) { }

  public generateAssignment(retry = 500): void {
    if (this.designation.status !== DesignationStatus.OPEN) {
      throw new BadRequestException(`Designação não pode ser enviada, pois está ${DesignationStatusPT_BR[this.designation.status]}`);
    }
    this.reset();
    this.shuffle(this.designation.assignments);

    for (const assignment of this.designation.assignments) {
      if (!assignment.point.status) continue;
      this.shuffle(this.designation.participants);
      const minMax = [assignment.config.min, assignment.config.max];
      const min = minMax[randomIndex(minMax)];
      let loopCount = 0;

      for (const [index, participant] of this.designation.participants.entries()) {
        if (participant.profile === ParticipantProfile.CAPTAIN || participant.profile === ParticipantProfile.COORDINATOR) continue;
        // Atingiu o limite de participantes por ponto, então para o loop
        if (min === loopCount) break;
        // Ponto não tem participantes, então adiciona o participante
        if (assignment.participants.length === 0) {
          assignment.participants.push(participant);
          this.designation.participants.splice(index, 1);
          loopCount++;
          continue;
        }
        // Ponto tem 1 participante, então verifica se o participante é do mesmo sexo
        if (assignment.participants.length === 1) {
          if (assignment.participants.map((participant) => participant.sex).includes(participant.sex)) {
            assignment.participants.push(participant);
            this.designation.participants.splice(index, 1);
            loopCount++;
            continue;
          }
        }
        // Ponto tem 2 participantes
        if (assignment.participants.length === 2) {
          assignment.participants.push(participant);
          this.designation.participants.splice(index, 1);
          loopCount++;
          continue;
        }
      }
    }

    if (this.designation.retryGenerateAssignment) {
      if (this.count < retry) {
        this.generateAssignment(retry);
      } else {
        // Para grupos especiais, permite que participantes fiquem sem atribuição
        if (this.designation.group.type === GroupType.SPECIAL) {
          console.log(`Grupo especial: alguns participantes podem ficar sem atribuição`);
          return;
        }
        throw new BadRequestException(`Não foi possível designar todos os participantes. Total participantes: ${this.designation.participantsCount}, Total vagas: ${this.designation.totalVacancies}`);
      }
    }
  }

  private reset() {
    this.count++;
    console.log("Generating assignments", this.count);
    this.designation.assignments.forEach((assignment) => {
      this.designation.participants.push(...assignment.participants);
      assignment.participants = [];
    });
  }

  private shuffle(array: Array<any>) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
