import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { connectToDatabase } from "../../infra/connectToDatabase";
import { ParticipantProfile } from "../../enums/ParticipantProfile";
import { ParticipantModel } from "../../repositories/models/ParticipantModel";
import { GroupModel } from "../../repositories/models/GroupModel";
import { IncidentHistoryModel } from "../../repositories/models/IncidentHistoryModel";
import { IParticipantModel } from "./interfaces/IParticipantModel";

interface IncidentOutput {
  id: string;
  reason: string;
  status: string;
}

interface ParticipantOutput {
  id: string;
  name: string;
  phone: string;
  profile_photo: string;
  profile: ParticipantProfile;
  incident_history: IncidentOutput | null;
}

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();
    const query = _event.queryStringParameters as { filter: string };
    const groupId = _event.pathParameters?.groupId;

    if (!groupId) {
      return ResponseHandler.error("Group id is required");
    }

    const filter = query?.filter
      ? {
          computed: { $regex: query.filter, $options: "i" },
        }
      : {};

    const participants = await ParticipantModel.find(filter)
      .populate({
        path: "incident_history",
        model: IncidentHistoryModel,
      })
      .transform((docs) => {
        return docs.map((doc) => {
          const participant = doc.toObject() as IParticipantModel;
          const incidentHistory = participant.incident_history;
          const incidentHistoryOutput: IncidentOutput | null = incidentHistory
            ? {
                id: incidentHistory._id,
                reason: incidentHistory.reason,
                status: incidentHistory.status,
              }
            : null;
          const participantOutput: ParticipantOutput = {
            id: participant._id,
            name: participant.name,
            phone: participant.phone,
            profile_photo: participant.profile_photo,
            profile: participant.profile as ParticipantProfile,
            incident_history: incidentHistoryOutput,
          };
          return participantOutput;
        });
      });

    return ResponseHandler.success(participants);
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
