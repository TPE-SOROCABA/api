import { Designation } from "domain/Designation";

export interface ValidationPlugin {
  validate(designation: Designation): void;
}
