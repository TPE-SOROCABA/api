import { AssignmentsParticipants, ParticipantGroupProfile, ParticipantProfile, ParticipantSex, Weekday } from "@prisma/client";

export interface IDesignationModel {
  id: string;
  name: string;
  groupId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  group: Group;
  cancellationJustification?: string;
  mandatoryPresence: boolean;
  assignments: Assignment[];
}

export interface Assignment {
  id: string;
  pointId: string;
  config_min: number;
  config_max: number;
  config_status: boolean;
  designationsId: string;
  point: Point;
  AssignmentsParticipants: Array<AssignmentsParticipants & { participant: Participant & { ParticipantsGroup: ParticipantsGroup[] } }>;
  AssignmentsPublicationCart: AssignmentsPublicationCart[];
}

export interface AssignmentsPublicationCart {
  id: string;
  assignmentId: string;
  publicationCartId: string;
  publicationCart: PublicationCart;
}

export interface PublicationCart {
  id: string;
  name: string;
  description: null;
  themePhoto: null;
}

export interface Point {
  id: string;
  name: string;
  locationPhoto: null;
}

export interface Group {
  id: string;
  name: string;
  config_max: number;
  config_min: number;
  config_start_hour: string;
  config_end_hour: string;
  config_weekday: string;
  EventDayGroup: EventDayGroup[];
  ParticipantsGroup: ParticipantsGroup[];
}

export interface EventDayGroup {
  id: string;
  eventDayId: string;
  groupId: string;
  eventDay: EventDay;
}

export interface EventDay {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  weekday: string;
}

export interface ParticipantsGroup {
  id: string;
  participantId: string;
  groupId: string;
  participant: Participant;
  profile: ParticipantGroupProfile;
}

export interface Participant {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  profile_photo: null;
  profile: ParticipantProfile;
  computed: string;
  sex: ParticipantSex;
  IncidentParticipant: any[];
}