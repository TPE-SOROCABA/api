export interface IWeekDesignationModel {
  _id: string;
  designation: Designation;
  participants: Participant[];
  point: Point;
  publication_carts: Point[];
  createdAt: Date;
  updatedAt: Date;
  expirationDate: Date;
  __v: number;
}

export interface Designation {
  _id: string;
  group: Group;
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  _id: string;
  event_day: Point;
  name: string;
  config: Config;
}

export interface Config {
  startHour: string;
  endHour: string;
  min: number;
  max: number;
  weekday: string;
  _id: string;
}

export interface Point {
  _id: string;
  name: string;
}

export interface Participant {
  _id: string;
  name: string;
  incident_history: {
    _id: string;
    reason: string;
    status: string;
  } | null;
}
