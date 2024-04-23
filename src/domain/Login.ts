import { createHash } from "crypto";
import { SignOptions, sign } from "jsonwebtoken";
export class LoginUtils {
  static encryptPassword(password: string): string {
    const hash = createHash("sha256");
    hash.update(password);
    return hash.digest("hex");
  }

  static createJWT(payload: Object, options: SignOptions = { expiresIn: "1d" }): string {
    return sign(payload, process.env.JWT_SECRET!, options);
  }
}
