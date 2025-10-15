import type { APIGatewayProxyStructuredResultV2, Handler, APIGatewayProxyEventV2WithRequestContext, APIGatewayEventRequestContextWithAuthorizer } from "aws-lambda";
import { ResponseHandler } from "../../../shared/ResponseHandler";
import { JsonHandler } from "../../../shared/JsonHandler";
import { InputParticipantIncidents } from "../../../contracts/InputParticipantIncidents";
import { IncidentStatus } from "../../../enums/IncidentStatus";
import { BadRequestException, Exception } from "../../../shared/Exception";
import { decode } from "jsonwebtoken";
import { prisma } from "../../../infra/prismaClient";
import { DesignationRepository } from "../../../repositories/DesignationRepository";
import { SendUpdateDesignation } from "../../../services/SendUpdateDesignation";

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
    const participantId = _event.pathParameters?.participantId;
    const designationId = _event.pathParameters?.designationId;
    const body = JsonHandler.parse<InputParticipantIncidents>(_event.body || "{}");
    const reporterId = getToken(_event) ?? participantId;

    const params = await InputParticipantIncidents.create({
      reason: body?.reason,
    });

    if (!participantId) {
      throw new BadRequestException("Id do participante não informado");
    }

    if (!designationId) {
      throw new BadRequestException("Id da designação não informado");
    }

    if (!params.reason) {
      throw new BadRequestException("Motivo do incidente não informado");
    }

    if (!reporterId) {
      throw new BadRequestException("Id do reporter não informado");
    }

    const participant = await prisma.participants.findFirst({ where: { id: participantId } });
    const reporter = await prisma.participants.findFirst({ where: { id: reporterId } });

    // Verificar se o participante está associado à designação específica
    const participantInGroup = await prisma.participantsGroups.findFirst({
      where: {
        participantId: participantId,
        group: {
          Designations: {
            some: {
              id: designationId
            }
          }
        }
      },
      include: {
        group: {
          include: {
            Designations: {
              where: {
                id: designationId
              }
            }
          }
        }
      }
    });

    if (!participant || !reporter || !participantInGroup) {
      throw new Exception(404, "Parâmetros inválidos ou participante não encontrado na designação");
    }

    const designation = await designationRepository.findByDesignationId(designationId);

    if (!designation) {
      throw new Exception(404, "Designação não encontrada");
    }

    // Verificar se já existe um incidente aberto para este participante nesta designação
    const existingIncident = await prisma.incidentHistories.findFirst({
      where: {
        participantId: participantId,
        designationId: designationId,
        status: IncidentStatus.OPEN
      }
    });

    if (existingIncident) {
      throw new BadRequestException("Já existe um incidente aberto para este participante nesta designação");
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

      designation.filterAssignment(participant.name);
      if (designation.assignmentsFiltered.length) {
        const assignment = designation.assignmentsFiltered.filter((a) => a.participants.some((p) => p.id === participantId))[0];
        if (assignment?.participants?.length) {
          console.log(`Removendo participante ${participant?.name} da designação`);
          designation.assignments.push(assignment);
          const participants = assignment.participants.filter((p) => p.id !== participantId).map((p) => p.id);
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
