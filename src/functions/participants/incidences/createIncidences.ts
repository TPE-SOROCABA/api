import type { APIGatewayProxyStructuredResultV2, Handler, APIGatewayProxyEventV2WithRequestContext, APIGatewayEventRequestContextWithAuthorizer } from "aws-lambda";
import { ResponseHandler } from "../../../shared/ResponseHandler";
import { JsonHandler } from "../../../shared/JsonHandler";
import { InputParticipantIncidents } from "../../../contracts/InputParticipantIncidents";
import { IncidentStatus } from "../../../enums/IncidentStatus";
import { BadRequestException, Exception } from "../../../shared/Exception";
import { decode } from "jsonwebtoken";
import { prisma } from "../../../infra/prismaClient";
import { DesignationStatus } from "@prisma/client";

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
      throw new BadRequestException("Id do participante não informado");
    }

    if (!params.reason) {
      throw new BadRequestException("Motivo do incidente não informado");
    }

    if (!reporterId) {
      throw new BadRequestException("Id do reporter não informado");
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
        status: {
          notIn: [DesignationStatus.CANCELLED, DesignationStatus.ARCHIVED],
        },
      },
    });

    if (!designation) {
      throw new Exception(404, "Designação não encontrada");
    }

    console.log(`Criando incidente para o participante ${participant.name}`);
    await prisma.$transaction(async (tx) => {
      console.log(`Criando incidente para o participante ${participant.name}`);
      await tx.incidentHistories
        .create({
          data: {
            participantId: participant.id,
            reporterId: reporter.id,
            reason: params.reason,
            status: IncidentStatus.OPEN,
            designationId: designation.id,
          },
        })
        .catch((error) => {
          console.log(error);
          throw new BadRequestException("Erro ao criar incidente");
        });
      const assignment = await tx.assignments.findFirst({
        where: {
          designationsId: designation.id,
        },
      });

      if (!assignment) {
        throw new BadRequestException("Erro ao criar incidente");
      }
      const { id, name } = await tx.$queryRaw<{ id: string; name: string }>`
      select p."name",ap.id from assignments a 
      inner join assignments_participants ap on a.id = ap.assignment_id 
      inner join participants p on p.id = ap.participant_id 
      where a.designations_id  = ${designation.id} and ap.participant_id = ${participant.id}`;

      console.log(`Deletando atribuições do participante ${name}`);
      await tx.assignmentsParticipants.deleteMany({
        where: {
          id,
        },
      });
      console.log(`Atribuições deletadas com sucesso`);
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
