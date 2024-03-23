import mongoose, { Schema, Types, model } from "mongoose";
import { IncidentStatus } from "../../enums/IncidentStatus";
import { ParticipantModel } from "./ParticipantModel";
import { DesignationModel } from "./DesignationModel";

export interface IIncidentHistory {
  participant: Types.ObjectId;
  reporter: Types.ObjectId;
  designation: Types.ObjectId;
  reason: string;
  status: IncidentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const incidentHistorySchema: Schema<IIncidentHistory> = new Schema<IIncidentHistory>({
  participant: { type: mongoose.Schema.Types.ObjectId, required: true, ref: ParticipantModel },
  reporter: { type: mongoose.Schema.Types.ObjectId, required: true, ref: ParticipantModel },
  designation: { type: mongoose.Schema.Types.ObjectId, required: true, ref: DesignationModel },
  reason: { type: String, required: true },
  status: { type: String, required: true, enum: Object.values(IncidentStatus) },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
});

export const IncidentHistoryModel = model<IIncidentHistory>("incidenthistories", incidentHistorySchema);
