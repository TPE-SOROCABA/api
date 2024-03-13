import { createHash } from "crypto";
import { sign } from "jsonwebtoken";

type LoginParams = {
  cpf: string;
  password: string;
};

export class Login {
  cpf: string;
  password: string;

  private constructor(cpf: string, password: string) {
    this.cpf = cpf;
    this.password = this.encryptPassword(password);
  }

  static create(params: LoginParams): Login {
    return new Login(params.cpf, params.password);
  }

  private encryptPassword(password: string): string {
    const hash = createHash("sha256");
    hash.update(password);
    return hash.digest("hex");
  }

  static createJWT(payload: Object): string {
    return sign(payload, process.env.JWT_SECRET!, { expiresIn: "1h" });
  }

}
