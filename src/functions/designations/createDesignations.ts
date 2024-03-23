import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { DesignationModel } from "../../repositories/models/DesignationModel";
import { DesignationStatus } from "../../enums/DesignationStatus";
import { connectToDatabase } from "../../infra/connectToDatabase";
import { GroupModel } from "../../repositories/models/GroupModel";
import { DesignationTemplateModel } from "../../repositories/models/DesignationTemplateModel";
import { PointPublicationCartModel } from "../../repositories/models/PointPublicationCartModel";
import { IGroupModel } from "./interfaces/IGroupModel";
import { ParticipantModel } from "../../repositories/models/ParticipantModel";



export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();
    const groupId = _event.queryStringParameters?.groupId;
    if (!groupId) {
      return ResponseHandler.error({ message: "Parâmetros inválidos" });
    }

    await DesignationModel.updateMany(
      {
        group: groupId,
        status: DesignationStatus.OPEN,
      },
      { status: DesignationStatus.CLOSED, updatedAt: new Date() }
    );

    const group = await GroupModel.findById(groupId).populate<IGroupModel>({
      path: "designation_template",
      model: DesignationTemplateModel,
      foreignField: "_id",
      populate: {
        path: "point_publication_carts",
        model: PointPublicationCartModel,
      },
    });

    if (!group) {
      return ResponseHandler.error({ message: "Grupo não encontrado" });
    }

    await DesignationModel.create({
      assignments: group.designation_template.point_publication_carts.map((pointPublicationCart) => ({
        point: pointPublicationCart.pointId,
        publication_carts: pointPublicationCart.publicationCartIds,
        participants: [],
        config: {
          min: pointPublicationCart.minParticipants,
          max: pointPublicationCart.maxParticipants,
        },
      })),
      group: groupId,
      participants: group.participants,
      status: DesignationStatus.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await ParticipantModel.updateMany(
      {
        _id: { $in: group.participants },
      },
      { $set: { incident_history: null } }
    );

    return ResponseHandler.success({ message: "Designação criada com sucesso!" });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
