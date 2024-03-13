import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { connectToDatabase } from "../../infra/connectToDatabase";
import { ParticipantProfile } from "../../enums/ParticipantProfile";
import { ParticipantModel } from "../../repositories/models/ParticipantModel";

interface ParticipantOutput {
  id: string;
  name: string;
  phone: string;
  profile_photo: string;
  profile: ParticipantProfile
}

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();
    const query = _event.queryStringParameters as { filter: string };
    
    const filter = query?.filter ? { 
      computed: { $regex: query.filter, $options: 'i' }
    } : {};

    const participants = await ParticipantModel.find(filter);
    const participantsWithOutput: ParticipantOutput[] = participants.map((participant) => {
      return {
        id: participant._id.toString(),
        name: participant.name,
        phone: participant.phone,
        profile_photo: participant.profile_photo || '',
        profile: participant.profile,
      }
    })
    return ResponseHandler.success<ParticipantOutput[]>(participantsWithOutput);
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
