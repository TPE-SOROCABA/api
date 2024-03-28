import mongoose, { Schema, Types, model } from "mongoose";

export interface IWeekDesignation {
  designation: Types.ObjectId;
  participants: Array<Types.ObjectId>;
  publication_carts: Array<Types.ObjectId>;
  point: Types.ObjectId;
  expirationDate: Date;
}

const weekDesignationSchema = new Schema<IWeekDesignation>({
  designation: { type: mongoose.Schema.Types.ObjectId, ref: "designations" },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "participants" }],
  point: { type: mongoose.Schema.Types.ObjectId, ref: "points" },
  publication_carts: [{ type: mongoose.Schema.Types.ObjectId, ref: "publicationcarts" }],
  expirationDate: { type: Date, required: true },
});

export const WeekDesignationModel = model<IWeekDesignation>("weekdesignations", weekDesignationSchema);
