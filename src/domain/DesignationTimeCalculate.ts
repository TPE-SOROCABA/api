import { Designations } from "@prisma/client";
import dayjs from "dayjs";

export class DesignationTimeCalculate {
  private designationStartDate: Date;
  private designationEndDate: Date;

  constructor(
    designation: Designations,
    private dateActual: Date
  ) {
    this.designationStartDate = dayjs(designation.designationDate).toDate();

    this.designationEndDate = dayjs(designation.designationEndDate).toDate();

    console.log({
      groupDateStart: this.designationStartDate,
      groupDateEnd: this.designationEndDate,
      groupDateActual: this.dateActual,
    });
  }

  get isDesignationStart(): boolean {
    return this.dateActual >= this.designationStartDate && this.dateActual <= this.designationEndDate;
  }

  get isDesignationEnd(): boolean {
    return this.dateActual >= this.designationEndDate;
  }

  get isDesignationStartLess2Hours(): boolean {
    return this.dateActual < this.designationStartDate && this.dateActual >= dayjs(this.designationStartDate).subtract(2, "hour").toDate();
  }

  get isDesignationEndMore48Hours(): boolean {
    return this.dateActual > this.designationEndDate && this.dateActual >= dayjs(this.designationEndDate).add(48, "hour").toDate();
  }
}
