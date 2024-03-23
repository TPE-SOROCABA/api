import type { APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../../shared/ResponseHandler";
import { connectToDatabase } from "../../../infra/connectToDatabase";
import { IncidentHistoryModel } from "../../../repositories/models/IncidentHistoryModel";
import { ParticipantModel } from "../../../repositories/models/ParticipantModel";
import { DesignationModel } from "../../../repositories/models/DesignationModel";

export const handler: Handler = async (_event: APIGatewayProxyEventV2 & { requestContext: { authorizer: { principalId: string } } }): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();
    const result = await IncidentHistoryModel.find()
      .populate({
        path: "participant",
        model: ParticipantModel,
        select: "name",
      })
      .populate({
        path: "designation",
        model: DesignationModel,
        select: ["name", "createdAt", "status"],
      })
      .populate({
        path: "reporter",
        model: ParticipantModel,
        select: "name",
      })
      .sort({ createdAt: -1 })
      .transform((docs: any[]) => {
        return docs.map((doc) => {
          return {
            id: doc._id,
            reason: doc.reason,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            participant: {
              id: doc.participant._id,
              name: doc.participant.name,
            },
            reporter: {
              id: doc.reporter._id,
              name: doc.reporter.name,
            },
            designation: {
              id: doc.designation._id,
              name: doc.designation.name,
              createdAt: doc.designation.createdAt,
              status: doc.designation.status,
            },
            status: doc.status,
          };
        });
      });
    return ResponseHandler.success(result);
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
