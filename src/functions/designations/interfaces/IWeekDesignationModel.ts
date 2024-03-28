import { ParticipantSex } from "../../../enums/ParticipantSex";

export interface IWeekDesignationModel {
  _id:            string;
  designation:    Designation;
  participant:    Participant;
  expirationDate: Date;
  __v:            number;
}

export interface Designation {
  _id:         string;
  group:       Group;
  assignments: Assignment[];
  createdAt:   Date;
  updatedAt:   Date;
}

export interface Assignment {
  config:            AssignmentConfig;
  point:             EventDay;
  publication_carts: EventDay[];
  participants:      Participant[];
  _id:               string;
}

export interface AssignmentConfig {
  min:    number;
  max:    number;
  status: boolean;
}

export interface Participant {
  _id:               string;
  name:              string;
  sex:               Sex;
  incident_history: {
    reason: string;
    status: boolean;
  } | null;
}

export enum Sex {
  Female = "FEMALE",
  Male = "MALE",
}

export interface EventDay {
  _id:  string;
  name: string;
}

export interface Group {
  _id:       string;
  event_day: EventDay;
  name:      string;
  config:    GroupConfig;
}

export interface GroupConfig {
  startHour: string;
  endHour:   string;
  min:       number;
  max:       number;
  weekday:   string;
  _id:       string;
}
