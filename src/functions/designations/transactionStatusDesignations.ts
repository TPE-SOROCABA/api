import { DesignationStatus } from "@prisma/client";
import type { ScheduledHandler } from "aws-lambda";
import dayjs from "dayjs";
import { GroupTimeCalculate } from "domain/GroupTimeCalculate";
import { prisma } from "infra/prismaClient";
import { TransactionDesignationClosedEndMore48Hours } from "services/transaction-designation/TransactionDesignationClosedEndMore48Hours";
import { TransactionDesignationInProgress } from "services/transaction-designation/TransactionDesignationInProgress";
import { TransactionStatusDesignationOpenLess2Hours } from "services/transaction-designation/TransactionDesignationOpenLess2Hours";

export const handler: ScheduledHandler = async (): Promise<void> => {
  console.log('Running transactionStatusDesignations');
  const groups = await prisma.groups.findMany({
    include: {
      Designations: {
        where: {
          status: {
            in: [DesignationStatus.OPEN, DesignationStatus.IN_PROGRESS, DesignationStatus.CLOSED]
          }
        }
      }
    }
  });

  for (const group of groups) {
    const groupTimeCalculate = new GroupTimeCalculate(group, dayjs().subtract(3, 'hours').toDate());
    if (groupTimeCalculate.isDesignationStartLess2Hours) {
      const designationOpen = group.Designations.find(d => d.status === DesignationStatus.OPEN)
      if(designationOpen) {
        await TransactionStatusDesignationOpenLess2Hours(designationOpen);
      }
    }

    if (groupTimeCalculate.isDesignationEnd) {
      const designationInProgress = group.Designations.find(d => d.status === DesignationStatus.IN_PROGRESS)
      if(designationInProgress) {
        await TransactionDesignationInProgress(designationInProgress);
      }
    }

    if (groupTimeCalculate.isDesignationEndMore48Hours) {
      const designationClosed = group.Designations.find(d => d.status === DesignationStatus.CLOSED)
      if(designationClosed) {
        await TransactionDesignationClosedEndMore48Hours(designationClosed);
      }
    }
  }
  console.log('End transactionStatusDesignations');
};




