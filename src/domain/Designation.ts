import { DesignationStatus, GroupType, Weekday } from "@prisma/client";
import { IncidentStatus } from "../enums/IncidentStatus";
import { ParticipantProfile } from "../enums/ParticipantProfile";
import { ParticipantSex } from "../enums/ParticipantSex";
import { WeekdayNumber } from "../enums/Weekday";
import { ValidationPlugin } from "./DesignationRulesValidation/ValidationPlugin";
import { GenerateAssignments } from "./GenerateAssignments";
import { DesignationState } from "./DesignationState";

export class Designation {
  public incidents: Participant[] = [];
  public assignmentsFiltered: Assignments[] = [];
  public cancellationJustification: string = "";
  public mandatoryPresence: boolean = true;
  private validations: ValidationPlugin[] = [];
  public total = {
    participants: 0,
    vacancies: 0
  }

  constructor(
    readonly id: string,
    public group: Group,
    public status: DesignationStatus,
    public assignments: Assignments[],
    public participants: Participant[],
    readonly createdAt: Date,
    public updatedAt: Date
  ) {
    this.setup();
  }

  private setup() {
    const filterParticipantOff = (participant: Participant) => {
      if (participant?.incident_history?.status === IncidentStatus.OPEN) {
        this.incidents.push(participant);
        return false;
      } else {
        participant.incident_history = null;
      }
      return true;
    };

    this.participants = this.participants.filter(filterParticipantOff);
    for (const assignment of this.assignments) {
      assignment.participants = assignment.participants.filter(filterParticipantOff);
    }

    this.orderAssignment();
  }

  public generateAssignment(): void {
    const generate = new GenerateAssignments(this);
    generate.generateAssignment();
    this.orderAssignment();
    this.updatedAt = new Date();
    this.applyValidations();
  }

  private orderAssignment() {
    this.assignments = this.assignments.sort((a, b) => a.point.name.localeCompare(b.point.name));
    this.assignments.forEach((assignment) => assignment.participants.sort((a, b) => a.name.localeCompare(b.name)));
    this.assignments.forEach((assignment) => assignment.publication_carts.sort((a, b) => a.name.localeCompare(b.name)));
    this.assignments
      .sort((a, b) => (a.point.status === b.point.status ? 0 : a.point.status ? -1 : 1))
      .sort((a, b) => {
        if (a.participants.length === 0 && b.participants.length === 0) return 0; // ambos têm zero participantes, permanecem na mesma ordem
        if (a.participants.length === 0) return 1; // 'a' tem zero participantes, então vem depois de 'b'
        if (b.participants.length === 0) return -1; // 'b' tem zero participantes, então vem antes de 'a'
        return 0;
      });
  }

  public filterAssignment(filter: string): void {
    this.assignments = this.assignments.filter((assignment) => {
      const reg = new RegExp(filter, "i");
      if (reg.test(assignment.point.name.toLowerCase())) {
        this.assignmentsFiltered.push(assignment);
        return false;
      }

      const participants = assignment.participants.filter((participant) => reg.test(participant.name.toLowerCase()));
      if (participants.length) {
        this.assignmentsFiltered.push({ ...assignment });
        return false;
      }
      return true;
    });
  }

  getNextDate(today = new Date()): Date {
    const weekday = WeekdayNumber[this.group.config.weekday as any];
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + ((+weekday + 7 - today.getDay()) % 7));
    nextDate.setHours(+this.group.config.endHour.split(":")[0]);
    nextDate.setMinutes(+this.group.config.endHour.split(":")[1]);

    if (nextDate < today) {
      nextDate.setDate(nextDate.getDate() + 7);
    }

    return nextDate;
  }

  get captainsAndCoordinatorsNumber(): number {
    return this.participants.filter((participant) => participant.profile === ParticipantProfile.CAPTAIN || participant.profile === ParticipantProfile.COORDINATOR).length;
  }

  get oneParticipantAssignments(): boolean {
    return this.assignments.some((assignment) => assignment.participants.length === 1);
  }

  get participantsCount(): number {
    return this.participants.length + this.assignments.reduce((acc, assignment) => acc + assignment.participants.length, 0);
  }

  get totalVacancies(): number {
    return this.assignments
      .filter((assignment) => assignment.point.status)
      .map((assignment) => assignment.config.max)
      .reduce((acc, max) => acc + max, 0);
  }

  get captainsAndCoordinators(): Participant[] {
    const participants: Participant[] = [];
    console.log(`Procurando responsáveis`);
    participants.push(...this.participants.filter((p) => p.profile === ParticipantProfile.CAPTAIN || p.profile === ParticipantProfile.COORDINATOR));
    participants.push(...this.assignments.map((a) => a.participants.filter((p) => p.profile === ParticipantProfile.CAPTAIN || p.profile === ParticipantProfile.COORDINATOR)).flat());

    return participants;
  }

  get retryGenerateAssignment() {
    return this.participants.filter((participant) => !Boolean(participant.incident_history)).length > this.captainsAndCoordinatorsNumber || this.oneParticipantAssignments;
  }

  public updatePointStatus(pointId: string, status: boolean): void {
    const designationState = new DesignationState(this);
    designationState.updatePointStatus(pointId, status);
  }

  // atualizar participantes em um ponto
  public updateParticipants(pointId: string, participantsIds: string[]): boolean {
    const designationState = new DesignationState(this);
    return designationState.updateParticipants(pointId, participantsIds);
  }

  public updateStatus(status: DesignationStatus): void {
    const designationState = new DesignationState(this);
    designationState.updateStatus(status);
  }

  public cancelDesignation(justification: string): void {
    const designationState = new DesignationState(this);
    designationState.cancelDesignation(justification);
  }

  public setMandatoryPresence(mandatoryPresence: boolean): void {
    const designationState = new DesignationState(this);
    designationState.setMandatoryPresence(mandatoryPresence);
  }

  public applyValidations(): void {
    this.validations.forEach((validation) => {
      validation.validate(this);
    });
  }

  addValidationPlugin(validation: ValidationPlugin): void {
    this.validations.push(validation);
  }

  toJson() {
    const designationClone = JSON.parse(JSON.stringify(this))
    delete designationClone['validations']
    designationClone.total.participants = this.participantsCount
    designationClone.total.vacancies = this.totalVacancies
    return designationClone
  }
}

export type Participant = {
  id: string;
  name: string;
  profile: ParticipantProfile;
  profile_photo: string | null;
  sex: ParticipantSex;
  phone: string;
  incident_history: {
    id: string;
    reason: string;
    status: string;
  } | null;
};

export type Assignments = {
  id: string;
  point: {
    id: string;
    name: string;
    status: boolean;
  };
  publication_carts: {
    id: string;
    name: string;
  }[];
  participants: Participant[];
  config: {
    min: number;
    max: number;
  };
  error?: string;
};

export type Group = {
  id: string;
  name: string;
  type: GroupType;
  config: {
    endHour: string;
    startHour: string;
    weekday: Weekday;
    minParticipants: number;
    maxParticipants: number;
  };
};
