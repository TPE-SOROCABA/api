import { Weekday_PT_BR } from 'src/enums/Weekday';
import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { prisma } from "infra/prismaClient";
import { DesignationStatus, Designations, Participants } from "@prisma/client";
import { Exception } from "shared/Exception";

export interface IGroup {
  id:                string;
  name:              string;
  configWeekday:    any;
  coordinator:       Participants;
  designation:      Designations;
}

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const groupId = _event.pathParameters?.groupId;

    if (!groupId) {
      throw new Exception(404, "Parâmetros inválidos");
    }

    const group = await prisma.groups.findFirst({
      where: {
        id: groupId,
      },
      include: {
        coordinator: true,
        Designations: {
          where: {
            status: {
              not: DesignationStatus.ARCHIVED
            }
          }
        }
      },
    });
  
    if (!group) {
      throw new Exception(404, "Grupo não encontrado");
    }

    return ResponseHandler.success<IGroup>({
      id: group.id,
      name: group.name,
      configWeekday: Weekday_PT_BR[group.config_weekday],
      coordinator: group.coordinator!,
      designation: group?.Designations[0],
    });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};




