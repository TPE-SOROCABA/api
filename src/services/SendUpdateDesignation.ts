import { SQS } from "aws-sdk";
import { Designation } from "../domain/Designation";

export class SendUpdateDesignation {
  async execute(designation: Designation) {
    const sqs = new SQS();

    await sqs
      .sendMessage({
        MessageBody: JSON.stringify(designation),
        QueueUrl: process.env.DESIGNATION_UPDATE_QUEUE!,
        MessageGroupId: designation.id,
        MessageDeduplicationId: designation.id,
      })
      .promise();
  }
}
