import { Schema, model } from "mongoose";

interface IUser {
  name: string;
  email: string;
  cpf: string;
  password: string;
  avatar?: string;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  cpf: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: String,
});

export const User = model<IUser>("user", userSchema);
