import { DesignationStatus, Weekday } from "@prisma/client";
import { IncidentStatus } from "../enums/IncidentStatus";
import { ParticipantProfile } from "../enums/ParticipantProfile";
import { ParticipantSex } from "../enums/ParticipantSex";
import { WeekdayNumber } from "../enums/Weekday";
import { Exception } from "../shared/Exception";

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
  public incidents: Participant[] = [];
  public assignmentsFiltered: Assignments[] = [];
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

    this.incidents = this.incidents.filter((participant) => {
      if (participant.incident_history?.status === IncidentStatus.IGNORED) {
        participant.incident_history = null;
        this.participants.push(participant);
        return false;
      }
      return true;
    });
    this.orderAssignment();
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

  get retryGenerateAssignment() {
    return this.participants.filter((participant) => !Boolean(participant.incident_history)).length > this.captainsAndCoordinatorsNumber || this.oneParticipantAssignments;
  }

  get captainsAndCoordinators(): Participant[] {
    const participants: Participant[] = [];
    console.log(`Procurando responsáveis`);
    participants.push(...this.participants.filter((p) => p.profile === ParticipantProfile.CAPTAIN || p.profile === ParticipantProfile.COORDINATOR));
    participants.push(...this.assignments.map((a) => a.participants.filter((p) => p.profile === ParticipantProfile.CAPTAIN || p.profile === ParticipantProfile.COORDINATOR)).flat());

    return participants;
  }

  public generateAssignment(retry = 100): void {
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

    this.orderAssignment();
    this.updatedAt = new Date();

    if (this.retryGenerateAssignment) {
      if (count < retry) {
        count++;
        this.generateAssignment(retry);
      } else {
        throw new Exception(400, `Não foi possível designar todos os participantes. Total participantes: ${this.participantsCount}, Total vagas: ${this.totalVacancies}`);
      }
    }
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
        this.assignmentsFiltered.push({ ...assignment, participants });
        return false;
      }
      return true;
    });
  }

  public isParticipantsWithoutAssignments(): { status: boolean; message: string } {
    const filterParticipant = (participant: Participant): boolean => {
      if (participant.profile !== ParticipantProfile.CAPTAIN && participant.profile !== ParticipantProfile.COORDINATOR) {
        if (participant.incident_history) {
          if (participant.incident_history.status == IncidentStatus.OPEN) {
            return false;
          }
          return true;
        } else {
          return true;
        }
      }
      return false;
    };
    const status = this.participants.some(filterParticipant);
    const nomes = this.participants.filter(filterParticipant).map((participant) => participant.name);
    return { status, message: nomes.join(", ") };
  }

  public updatePointStatus(pointId: string, status: boolean): void {
    const assignment = this.assignments.find((assignment) => assignment.point.id === pointId);
    if (!assignment) throw new Exception(404, "Ponto não encontrado");

    assignment.point.status = status;
    if (!status) {
      this.participants.push(...assignment.participants);
      assignment.participants = [];
    }
    this.updatedAt = new Date();
  }

  // atualizar participantes em um ponto
  public updateParticipants(pointId: string, participantsIds: string[]): void {
    // encontra o ponto
    const assignment = this.assignments.find((assignment) => assignment.point.id === pointId);
    if (!assignment) throw new Exception(404, "Ponto não encontrado");

    // pegar o diferente e lançar em this.participants
    const participantsRemoved = assignment.participants.filter((participant) => !participantsIds.includes(participant.id));
    this.participants.push(...participantsRemoved);

    // encontra os participantes que serão movidos de um ponto para outro
    for (const a of this.assignments) {
      // filtra os participantes que serão movidos
      const participants = a.participants.filter((participant) => participantsIds.includes(participant.id));
      this.participants.push(...participants);
      a.participants = a.participants.filter((participant) => !participantsIds.includes(participant.id));
    }
    // filtra os participantes que serão movidos
    const participants = this.participants.filter((participant) => participantsIds.includes(participant.id));
    // adiciona os participantes no ponto
    assignment.participants = participants;
    // remove os participantes da lista de participantes
    this.participants = this.participants.filter((participant) => !participantsIds.includes(participant.id));
    this.updatedAt = new Date();
  }

  public updateStatus(status: DesignationStatus): void {
    this.status = status;
    this.updatedAt = new Date();
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

  private shuffle(array: Array<any>) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
