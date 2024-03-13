import { Schema, model } from "mongoose";

export interface IParticipantAuth {
    id: string;
    participantId: string;
    password: string;
    resetPasswordCode: string;
    resetPasswordExpires: Date;
  }
  
  const participantAuthSchema = new Schema<IParticipantAuth>({
    participantId: { type: String, required: true, ref: "participant" },
    password: { type: String, required: true },
    resetPasswordCode: String,
    resetPasswordExpires: Date,
  });
  
  export const ParticipantAuthModel = model<IParticipantAuth>("participant_auth", participantAuthSchema);