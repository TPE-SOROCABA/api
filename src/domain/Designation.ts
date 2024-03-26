import { DesignationStatus } from "../enums/DesignationStatus";
import { IncidentStatus } from "../enums/IncidentStatus";
import { ParticipantProfile } from "../enums/ParticipantProfile";
import { ParticipantSex } from "../enums/ParticipantSex";
import { Weekday } from "../enums/Weekday";
import { Exception } from "../shared/Exception";

export type Participant = {
  id: string;
  name: string;
  profile: ParticipantProfile;
  profile_photo: string | undefined;
  sex: ParticipantSex;
  phone: string;
  incidentHistory: {
    id: string;
    reason: string;
    status: string;
  } | null;
};

export type Assignments = {
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
};

export type Group = {
  id: string;
  name: string;
  config: {
    endHour: string;
    startHour: string;
    weekday: Weekday;
    minParticipants: number;
    maxParticipants: number;
  };
};

const randomIndex = (array: Array<number>) => Math.floor(Math.random() * array.length);
let count: number = 0;
export class Designation {
  get captainsAndCoordinators(): number {
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

  get retryGenerateAssignment() {
    return this.participants.length > this.captainsAndCoordinators || this.oneParticipantAssignments;
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
    count = 0;
    const filterParticipantOff = (participant: Participant) => (participant.incidentHistory ? participant.incidentHistory.status !== IncidentStatus.OPEN : true);
    this.participants = this.participants.filter(filterParticipantOff);
    for (const assignment of this.assignments) {
      assignment.participants = assignment.participants.filter(filterParticipantOff);
    }
  }

  public generateAssignment(): void {
    console.log("Generating assignments", count);
    this.assignments = this.assignments.map((assignment) => {
      this.participants.push(...assignment.participants);
      return {
        ...assignment,
        participants: [],
      };
    });
    this.shuffle(this.assignments);

    for (const assignment of this.assignments) {
      if (!assignment.point.status) continue;
      this.shuffle(this.participants);
      const minMax = [assignment.config.min, assignment.config.max];
      const min = minMax[randomIndex(minMax)];
      let loopCount = 0;

      for (const [index, participant] of this.participants.entries()) {
        if (participant.profile === ParticipantProfile.CAPTAIN || participant.profile === ParticipantProfile.COORDINATOR) continue;
        // Atingiu o limite de participantes por ponto, então para o loop
        if (min === loopCount) break;
        // Ponto não tem participantes, então adiciona o participante
        if (assignment.participants.length === 0) {
          assignment.participants.push(participant);
          this.participants.splice(index, 1);
          loopCount++;
          continue;
        }
        // Ponto tem 1 participante, então verifica se o participante é do mesmo sexo
        if (assignment.participants.length === 1) {
          if (assignment.participants.map((participant) => participant.sex).includes(participant.sex)) {
            assignment.participants.push(participant);
            this.participants.splice(index, 1);
            loopCount++;
            continue;
          }
        }
        // Ponto tem 2 participantes
        if (assignment.participants.length === 2) {
          assignment.participants.push(participant);
          this.participants.splice(index, 1);
          loopCount++;
          continue;
        }
      }
    }

    this.assignments = this.assignments.sort((a, b) => a.point.name.localeCompare(b.point.name));
    this.assignments.forEach((assignment) => assignment.participants.sort((a, b) => a.name.localeCompare(b.name)));
    this.assignments.forEach((assignment) => assignment.publication_carts.sort((a, b) => a.name.localeCompare(b.name)));
    this.assignments.sort((a, b) => (a.point.status === b.point.status ? 0 : a.point.status ? -1 : 1));
    this.updatedAt = new Date();

    if (this.retryGenerateAssignment) {
      if (count < 100) {
        count++;
        this.generateAssignment();
      } else {
        throw new Exception(400, `Não foi possível designar todos os participantes. Total participantes: ${this.participantsCount}, Total vagas: ${this.totalVacancies}`);
      }
    }
  }

  public updateAssignments(assignments: Assignments[]): void {
    this.assignments = assignments;
    this.assignments.forEach((assignment) => {
      if (!assignment.point.status) {
        this.participants.push(...assignment.participants);
        assignment.participants = [];
      }
    });
    this.updatedAt = new Date();
  }

  public filterAssignment(filter: string): void {
    this.assignments.sort((_, a) => {
      const isContains = (object: { name: string }) => object.name.toLowerCase().includes(filter.toLowerCase());
      if (isContains(a.point)) return 1;

      const [participant] = a.participants.filter(isContains);
      if (participant) {
        if (isContains(participant)) return 1;
      }

      return -1;
    });
  }
  
  public isParticipantsWithoutAssignments(): boolean {
    return this.participants.some((participant) => participant.profile == ParticipantProfile.PARTICIPANT && !participant.incidentHistory);
  }

  private shuffle(array: Array<any>) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
