import { SQS } from "aws-sdk";
import { Designation } from "../domain/Designation";
import { v4 as uuid } from "uuid";

const checkOffline = (config: Object) => (process.env.NODE_ENV === "local" ? config : {});

export class SendUpdateDesignation {
  async execute(designation: Designation) {
    const sqs = new SQS(
      checkOffline({
        endpoint: "http://0.0.0.0:9324"
      })
    );

    await sqs
      .sendMessage({
        MessageBody: JSON.stringify(designation),
        QueueUrl: process.env.DESIGNATION_UPDATE_QUEUE!,
        MessageGroupId: designation.id,
        MessageDeduplicationId: uuid()
      })
      .promise();
  }
}
