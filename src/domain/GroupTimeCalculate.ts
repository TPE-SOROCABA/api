import { Groups } from "@prisma/client";
import dayjs from "dayjs";
import { WeekdayNumber } from "../enums/Weekday";

export class GroupTimeCalculate {
    private groupDateStart: Date;
    private groupDateEnd: Date;
  
    constructor(
      private group: Groups,
      private groupDateActual: Date
    ) {
      const weekday = this.group.config_weekday as keyof typeof WeekdayNumber;
      const startHour = this.group.config_start_hour;
      const endHour = this.group.config_end_hour;
  
      this.groupDateStart = dayjs(groupDateActual)
        .day(WeekdayNumber[weekday])
        .hour(Number(startHour.split(":")[0]))
        .minute(Number(startHour.split(":")[1]))
        .toDate();
      this.groupDateEnd = dayjs(groupDateActual)
        .day(WeekdayNumber[weekday])
        .hour(Number(endHour.split(":")[0]))
        .minute(Number(endHour.split(":")[1]))
        .toDate();

        console.log({
            groupDateStart: this.groupDateStart,
            groupDateEnd: this.groupDateEnd,
            groupDateActual: this.groupDateActual
        })
    }
  
    get isDesignationStart(): boolean {
      return this.groupDateActual >= this.groupDateStart && this.groupDateActual <= this.groupDateEnd;
    }

    get isDesignationEnd(): boolean {
      return this.groupDateActual >= this.groupDateEnd;
    }

    get isDesignationStartLess2Hours(): boolean {
        return this.groupDateActual < this.groupDateStart && this.groupDateActual >= dayjs(this.groupDateStart).subtract(2, 'hour').toDate();
    }

    get isDesignationEndMore48Hours(): boolean {
        return this.groupDateActual > this.groupDateEnd && this.groupDateActual >= dayjs(this.groupDateEnd).add(48, 'hour').toDate();
    }
  }
  