import { Schema, model } from "mongoose";

interface IUser {
  name: string;
  email: string;
  cpf: string;
  password: string;
  phone: string;
  avatar?: string;
  codeRecoveryPassword?: string;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  cpf: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  avatar: String,
  codeRecoveryPassword: {
    type: String,
    default: null
  }
});

// https://stackoverflow.com/questions/64271579/mongoose-set-ttl-on-mongodb-document
// Define um índice TTL para o campo codeRecoveryPassword com tempo de expiração de 5 minutos (300 segundos)
userSchema.index({ codeRecoveryPassword: 1 }, { expireAfterSeconds: 300 });

export const User = model<IUser>("user", userSchema);
