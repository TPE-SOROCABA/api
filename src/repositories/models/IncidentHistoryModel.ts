import { Schema, model } from "mongoose";
import { IncidentStatus } from "../../enums/IncidentStatus";

export interface IIncidentHistory {
  participantId: string;
  reporterId: string;
  // designationId: string;
  reason: string;
  status: IncidentStatus;
  createdAt: Date;
  updatedAt: Date;
}
  
  const incidentHistorySchema = new Schema<IIncidentHistory>({
    participantId: { type: String, required: true, ref: "participant" },
    reporterId: { type: String, required: true, ref: "participant" },
    // designationId: { type: String, required: true, ref: "designation" },
    reason: { type: String, required: true },
    status: { type: String, required: true, enum: Object.values(IncidentStatus) },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  });
  
  export const IncidentHistoryModel = model<IIncidentHistory>("incidentHistory", incidentHistorySchema);