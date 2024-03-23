import mongoose, { Schema, Types, model } from "mongoose";
import { Weekday } from "../../enums/Weekday";
import { ParticipantModel } from "./ParticipantModel";
import { DesignationTemplateModel } from "./DesignationTemplateModel";
import { EventDayModel } from "./EventDayModel";

interface IGroupConfig {
  startHour: string;
  endHour: string;
  min: number;
  max: number;
  weekday: Weekday;
}

export interface IGroup {
  designation_template: Types.ObjectId
  participants: Types.ObjectId[];
  event_day: Types.ObjectId;
  name: string;
  config: IGroupConfig;
}

const groupConfigSchema = new Schema<IGroupConfig>({
  startHour: { type: String, required: true },
  endHour: { type: String, required: true },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  weekday: { type: String, required: true, enum: Object.values(Weekday) },
});

export const groupSchema = new Schema<IGroup>({
  designation_template: { type: mongoose.Schema.Types.ObjectId, ref: DesignationTemplateModel },
  participants: [{ type: String, ref: ParticipantModel }],
  event_day: { type: mongoose.Schema.Types.ObjectId, ref: EventDayModel, required: true},
  name: { type: String, required: true },
  config: { type: groupConfigSchema, required: true },
});

export const GroupModel = model<IGroup>("groups", groupSchema);
