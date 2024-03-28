import mongoose, { Schema, Types, model } from "mongoose";

export interface IWeekDesignation {
  designation: Types.ObjectId;
  participant: Types.ObjectId;
  expirationDate: Date;
}

const weekDesignationSchema = new Schema<IWeekDesignation>({
  designation: { type: mongoose.Schema.Types.ObjectId, ref: "designations" },
  participant: { type: mongoose.Schema.Types.ObjectId, ref: "participants" },
  expirationDate: { type: Date, required: true },
});

export const WeekDesignationModel = model<IWeekDesignation>("weekdesignations", weekDesignationSchema);
