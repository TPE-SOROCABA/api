import type {  ScheduledHandler } from "aws-lambda";
import { WeekDesignationModel } from "../../repositories/models/WeekDesignationModel";
import { connectToDatabase } from "../../infra/connectToDatabase";

export const handler: ScheduledHandler = async (_event, _context) => {
  try {
    await connectToDatabase();
    await WeekDesignationModel.deleteMany({
      expirationDate: {
        $lt: new Date(),
      },
    });
  } catch (error) {
    console.log(error);
  }
};
