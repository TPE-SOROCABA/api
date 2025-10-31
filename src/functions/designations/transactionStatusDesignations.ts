import { DesignationStatus, GroupStatus } from "@prisma/client";
import type { ScheduledHandler } from "aws-lambda";
import dayjs from "dayjs";
import { DesignationTimeCalculate } from "domain/DesignationTimeCalculate";
import { prisma } from "infra/prismaClient";
import { TransactionDesignationClosedEndMore48Hours } from "services/transaction-designation/TransactionDesignationClosedEndMore48Hours";
import { TransactionDesignationInProgress } from "services/transaction-designation/TransactionDesignationInProgress";
import { TransactionStatusDesignationOpenLess2Hours } from "services/transaction-designation/TransactionDesignationOpenLess2Hours";

export const handler: ScheduledHandler = async (): Promise<void> => {
  console.log("Running transactionStatusDesignations");
  const groups = await prisma.groups.findMany({
    where: {
      status: GroupStatus.OPEN
    },
    include: {
      Designations: {
        where: {
          status: {
            in: [DesignationStatus.OPEN, DesignationStatus.IN_PROGRESS, DesignationStatus.CLOSED, DesignationStatus.CANCELLED],
          },
        },
      },
    },
  });

  for (const group of groups) {
    for (const designation of group.Designations) {
      try {
        const groupTimeCalculate = new DesignationTimeCalculate(designation, dayjs().subtract(3, "hours").toDate());
        if (groupTimeCalculate.isDesignationStartLess2Hours) {
          if (designation.status === DesignationStatus.OPEN) {
            await TransactionStatusDesignationOpenLess2Hours(designation);
          }
        }

        if (groupTimeCalculate.isDesignationEnd) {
          if (designation.status === DesignationStatus.IN_PROGRESS) {
            await TransactionDesignationInProgress(designation);
          }
        }

        if (groupTimeCalculate.isDesignationEndMore48Hours) {
          if (designation.status === DesignationStatus.CLOSED || designation.status === DesignationStatus.CANCELLED) {
            await TransactionDesignationClosedEndMore48Hours(designation);
          }
        }
      } catch (error) {
        console.error("Error in transactionStatusDesignations", error);
      }
    }
  }
  console.log("End transactionStatusDesignations");
};
