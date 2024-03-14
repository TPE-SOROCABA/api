import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { connectToDatabase } from "../../infra/connectToDatabase";
import { ParticipantProfile } from "../../enums/ParticipantProfile";
import { ParticipantModel } from "../../repositories/models/ParticipantModel";
import { IncidentHistoryModel } from "../../repositories/models/IncidentHistoryModel";
import { IncidentStatus } from "../../enums/IncidentStatus";

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
  incidentHistory: IncidentOutput | null;
}

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();
    const query = _event.queryStringParameters as { filter: string };

    const filter = query?.filter
      ? {
          computed: { $regex: query.filter, $options: "i" },
        }
      : {};

    const participants = await ParticipantModel.find(filter);

    const participantsWithOutput: ParticipantOutput[] = [];
    for (const participant of participants) {
      const [entity] = await IncidentHistoryModel.find({ participantId: participant._id, status: IncidentStatus.OPEN }).sort({ createdAt: -1 }).limit(1);
      const incidentHistory: IncidentOutput = {
        id: entity?._id.toString() || "",
        reason: entity?.reason || "",
        status: entity?.status || "",
      };
      const data = {
        id: participant._id.toString(),
        name: participant.name,
        phone: participant.phone,
        profile_photo: participant.profile_photo || "",
        profile: participant.profile,
        incidentHistory: entity ? incidentHistory : null,
      };
      participantsWithOutput.push(data);
    }

    return ResponseHandler.success<ParticipantOutput[]>(participantsWithOutput);
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
