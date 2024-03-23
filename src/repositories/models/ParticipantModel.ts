import mongoose, { Schema, Types, model } from "mongoose";
import { ParticipantProfile } from "../../enums/ParticipantProfile";
import { ParticipantSex } from "../../enums/ParticipantSex";

export type IParticipant = {
  _id: string;
  cpf: string;
  name: string;
  sex: ParticipantSex;
  phone: string;
  profile: ParticipantProfile;
  profile_photo?: string;
  computed: string;
  auth?: {
    password: string;
    resetPasswordCode?: string;
  };
  incident_history?: Types.ObjectId;
};

const authSchema = new Schema({
  password: { type: String, required: true },
  resetPasswordCode: String
});

export const participantSchema = new Schema<IParticipant>({
  cpf: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  sex: { type: String, required: true, enum: Object.values(ParticipantSex) },
  phone: { type: String, required: true, unique: true },
  profile_photo: String,
  profile: { type: String, required: true, enum: Object.values(ParticipantProfile) },
  computed: { type: String, required: true },
  auth: {
    type: authSchema,
    required: false,
  },
  incident_history: { type: mongoose.Schema.Types.ObjectId, ref: "incidenthistories" },
});

export const ParticipantModel = model<IParticipant>("participants", participantSchema);
