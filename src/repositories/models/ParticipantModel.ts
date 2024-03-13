import { Schema, model } from "mongoose";
import { ParticipantProfile } from "../../enums/ParticipantProfile";

export type IParticipant = {
  cpf: string;
  name: string;
  sex: string;
  phone: string;
  profile: ParticipantProfile;
  profile_photo?: string;
  computed: string;
};

const participantSchema = new Schema<IParticipant>({
  cpf: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  sex: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  profile_photo: String,
  profile: { type: String, required: true, enum: Object.values(ParticipantProfile) },
  computed: { type: String, required: true },
});

export const ParticipantModel = model<IParticipant>("participant", participantSchema);
