import type { APIGatewayProxyStructuredResultV2, Handler, APIGatewayProxyEventV2WithRequestContext, APIGatewayEventRequestContextWithAuthorizer } from "aws-lambda";
import { ResponseHandler } from "../../../shared/ResponseHandler";
import { JsonHandler } from "../../../shared/JsonHandler";
import { InputParticipantIncidents } from "../../../contracts/InputParticipantIncidents";
import { IncidentStatus } from "../../../enums/IncidentStatus";
import { BadRequestException, Exception } from "../../../shared/Exception";
import { decode } from "jsonwebtoken";
import { prisma } from "../../../infra/prismaClient";
import { DesignationStatus } from "@prisma/client";
import { DesignationRepository } from "repositories/DesignationRepository";
import { SendUpdateDesignation } from "services/SendUpdateDesignation";

type APIGatewayEventCustom = APIGatewayProxyEventV2WithRequestContext<
  APIGatewayEventRequestContextWithAuthorizer<{
    groupId: string;
    principalId: string;
  }>
>;

const designationRepository = new DesignationRepository();
const sendUpdateDesignation = new SendUpdateDesignation();

export const handler: Handler = async (_event: APIGatewayEventCustom): Promise<APIGatewayProxyStructuredResultV2> => {
  const responseHandler = new ResponseHandler(_event);
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

    const designation = await designationRepository.findOne(group.groupId);

    if (!designation) {
      throw new Exception(404, "Designação não encontrada");
    }

    designation.removeAllValidationPlugins();

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

      designation.filterAssignment(participant.name);
      if (designation.assignmentsFiltered.length) {
        const assignment = designation.assignmentsFiltered.filter((a) => a.participants.some((p) => p.id === id))[0];
        if (assignment?.participants?.length) {
          console.log(`Removendo participante ${participant?.name} da designação`);
          designation.assignments.push(assignment);
          const participants = assignment.participants.filter((p) => p.id !== id).map((p) => p.id);
          console.log({ participants });
          designation.updateParticipants(assignment.point.id, participants);
          await sendUpdateDesignation.execute(designation);
        }
      }
    });

    return responseHandler.success({ message: "Incidente criado com sucesso" });
  } catch (error) {
    return responseHandler.error(error);
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
