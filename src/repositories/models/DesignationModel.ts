import mongoose, { Schema, Types, model } from "mongoose";
import { DesignationStatus } from "../../enums/DesignationStatus";
import { PointModel } from "./PointModel";
import { PublicationCartModel } from "./PublicationCartModel";
import { ParticipantModel } from "./ParticipantModel";
import { GroupModel } from "./GroupModel";

interface Assignments {
  point: Types.ObjectId;
  publication_carts: Array<Types.ObjectId>;
  participants: Array<Types.ObjectId>;
  config: {
    min: number;
    max: number;
    status: boolean;
  };
}

export interface IDesignation {
  group: Types.ObjectId;
  status: DesignationStatus;
  assignments: Array<Assignments>;
  participants: Array<Types.ObjectId>;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<Assignments>({
  point: { type: mongoose.Schema.Types.ObjectId, ref: PointModel },
  publication_carts: [{ type: mongoose.Schema.Types.ObjectId, ref: PublicationCartModel }],
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: ParticipantModel }],
  config: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    status: { type: Boolean, default: true },
  },
});

const designationSchema = new Schema<IDesignation>({
  group: { type: mongoose.Schema.Types.ObjectId, ref: GroupModel },
  status: { type: String, required: true, enum: Object.values(DesignationStatus) },
  assignments: [assignmentSchema],
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: ParticipantModel }],
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
});

export const DesignationModel = model<IDesignation>("designations", designationSchema);
