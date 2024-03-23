import { DesignationStatus } from "../../../enums/DesignationStatus";
import { IncidentStatus } from "../../../enums/IncidentStatus";
import { ParticipantProfile } from "../../../enums/ParticipantProfile";
import { ParticipantSex } from "../../../enums/ParticipantSex";
import { Weekday } from "../../../enums/Weekday";

export interface IDesignationModel {
  _id: string;
  group: Group;
  status: DesignationStatus;
  assignments: Assignment[];
  participants: Participant[];
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface Assignment {
  config: AssignmentConfig;
  point: Point;
  publication_carts: PublicationCart[];
  participants: Participant[];
  _id: string;
}

export interface AssignmentConfig {
  min: number;
  max: number;
  status: boolean;
}

export interface Point {
  _id: string;
  name: string;
  locationPhoto: string;
  __v: number;
}

export interface PublicationCart {
  _id: string;
  name: string;
  description: Description;
  themePhoto: string;
  __v: number;
}

export enum Description {
  DescriçãoGenérica = "Descrição genérica",
}

export interface Group {
  _id: string;
  name: string;
  config: GroupConfig;
  __v: number;
  participants: Participant[];
  designation_template: string;
  event_day: EventDay;
}

export interface GroupConfig {
  startHour: string;
  endHour: string;
  weekday: Weekday;
  _id: string;
  max: number;
  min: number;
}

export interface EventDay {
  _id: string;
  coordinator_id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  weekday: string;
  __v: number;
}

export interface Participant {
  _id: string;
  cpf: string;
  name: string;
  sex: ParticipantSex;
  phone: string;
  profile_photo: string;
  profile: ParticipantProfile;
  computed: string;
  __v: number;
  incident_history?: IncidentHistory;
}

export interface IncidentHistory {
  participant: string;
  reporter: string;
  designation: string;
  reason: string;
  status: IncidentStatus;
  createdAt: Date;
  updatedAt: Date;
  _id: string;
}
