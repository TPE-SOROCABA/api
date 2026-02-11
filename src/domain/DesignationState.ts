import { DesignationStatus } from "@prisma/client";
import { NotFoundException } from "../shared/Exception";
import { Designation } from "./Designation";

export class DesignationState {
  constructor(public designation: Designation) { }

  public updatePointStatus(pointId: string, status: boolean): void {
    const assignment = this.designation.assignments.find((assignment) => assignment.point.id === pointId);
    if (!assignment) throw new NotFoundException("Ponto não encontrado");

    assignment.point.status = status;
    if (!status) {
      this.designation.participants.push(...assignment.participants);
      assignment.participants = [];
    }
    this.designation.updatedAt = new Date();
  }

  // atualizar participantes em um ponto
  public updateParticipants(pointId: string, participantsIds: string[]): boolean {
    // encontra o ponto
    const assignment = this.designation.assignments.find((assignment) => assignment.point.id === pointId);
    if (!assignment) throw new NotFoundException("Ponto não encontrado");
    try {
      // pegar o diferente e lançar em this.participants
      const participantsRemoved = assignment.participants.filter((participant) => !participantsIds.includes(participant.id));
      this.designation.participants.push(...participantsRemoved);

      // encontra os participantes que serão movidos de um ponto para outro
      for (const a of this.designation.assignments) {
        // filtra os participantes que serão movidos
        const participants = a.participants.filter((participant) => participantsIds.includes(participant.id));
        this.designation.participants.push(...participants);
        a.participants = a.participants.filter((participant) => !participantsIds.includes(participant.id));
      }
      // filtra os participantes que serão movidos
      const participants = this.designation.participants.filter((participant) => participantsIds.includes(participant.id));
      // adiciona os participantes no ponto
      assignment.participants = participants;
      // remove os participantes da lista de participantes
      this.designation.participants = this.designation.participants.filter((participant) => !participantsIds.includes(participant.id));
      this.designation.updatedAt = new Date();
      this.designation.applyValidations();
      return true;
    } catch (erro: any) {
      return false;
    }
  }

  public updateStatus(status: DesignationStatus): void {
    this.designation.status = status;
    this.designation.updatedAt = new Date();
  }

  public cancelDesignation(justification: string): void {
    this.designation.status = DesignationStatus.CANCELLED;
    this.designation.cancellationJustification = justification;
    this.designation.updatedAt = new Date();
  }

  public reopenDesignation(): void {
    this.designation.status = DesignationStatus.OPEN;
    this.designation.cancellationJustification = "";
    this.designation.updatedAt = new Date();
  }

  public setMandatoryPresence(mandatoryPresence: boolean): void {
    this.designation.mandatoryPresence = mandatoryPresence;
    this.designation.updatedAt = new Date();
  }
}
