import type { APIGatewayProxyStructuredResultV2, Handler, APIGatewayProxyEventV2WithRequestContext, APIGatewayEventRequestContextWithAuthorizer } from "aws-lambda";
import { ResponseHandler } from "../../../shared/ResponseHandler";
import { JsonHandler } from "../../../shared/JsonHandler";
import { InputParticipantIncidents } from "../../../contracts/InputParticipantIncidents";
import { IncidentStatus } from "../../../enums/IncidentStatus";
import { Exception } from "../../../shared/Exception";
import { decode } from "jsonwebtoken";
import { prisma } from "../../../infra/prismaClient";

type APIGatewayEventCustom = APIGatewayProxyEventV2WithRequestContext<
  APIGatewayEventRequestContextWithAuthorizer<{
    groupId: string;
    principalId: string;
  }>
>;

export const handler: Handler = async (_event: APIGatewayEventCustom): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const id = _event.pathParameters?.participantId;
    const body = JsonHandler.parse<InputParticipantIncidents>(_event.body || "{}");
    const reporterId = getToken(_event) ?? id;

    const params = await InputParticipantIncidents.create({
      reason: body?.reason,
    });

    if (!id) {
      throw new Exception(400, "Id do participante não informado");
    }

    if (!params.reason) {
      throw new Exception(400, "Motivo do incidente não informado");
    }

    if (!reporterId) {
      throw new Exception(400, "Id do reporter não informado");
    }

    const participant = await prisma.participants.findFirst({ where: { id } });
    const reporter = await prisma.participants.findFirst({ where: { id: reporterId } });
    const group = await prisma.participantsGroups.findFirst({ where: { participantId: id } });

    if (!participant || !reporter || !group) {
      throw new Exception(404, "Parâmetros inválidos");
    }

    const designation = await prisma.designations.findFirst({
      where: {
        groupId: group.groupId,
      },
    });

    if (!designation) {
      throw new Exception(404, "Designação não encontrada");
    }

    console.log(`Criando incidente para o participante ${participant.name}`);
    await prisma.incidentHistories.create({
      data: {
        participantId: participant.id,
        reporterId: reporter.id,
        reason: params.reason,
        status: IncidentStatus.OPEN,
        designationId: designation.id,
      },
    });

    return ResponseHandler.success({ message: "Incidente criado com sucesso" });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};

function getToken(event: any): string | null {
  try {
    const token = event.headers?.Authorization || event.headers?.authorization || "";
    const parts = token.split(" ");
    const payload = decode(parts[1]) as any;
    return payload["id"] || null;
  } catch (error) {
    return null;
  }
}
