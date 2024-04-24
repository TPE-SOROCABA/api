import { Weekday_PT_BR } from "./../../enums/Weekday";
import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { DesignationRepository } from "../../repositories/DesignationRepository";
import { WhatsAppService } from "../../services/WhatsAppService";
import { Z_APIWhatsAppAdapter } from "../../infra/adapter/Z_APIWhatsAppAdapter";
import { Exception } from "../../shared/Exception";
import { Designation, Participant } from "../../domain/Designation";
import { DesignationStatus } from "../../enums/DesignationStatus";
import { IncidentStatus, ParticipantProfile } from "@prisma/client";
import { SendUpdateDesignation } from "../../services/SendUpdateDesignation";

const designationRepository = new DesignationRepository();
const whatsaapService = new WhatsAppService(new Z_APIWhatsAppAdapter());
const sendUpdateDesignation = new SendUpdateDesignation();

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    console.log("Enviando designações");
    const designationId = _event.pathParameters?.designationId;
    if (!designationId) {
      return ResponseHandler.error({ message: "Parâmetros inválidos" });
    }

    const designation = await designationRepository.findByDesignationId(designationId);
    console.log(`Designação encontrada: ${designation.group.name}`);

    console.log(`Verificando se a designação possui participantes sem atribuições`);
    const hasParticipantsWithoutAssignments = designation.isParticipantsWithoutAssignments();
    if (hasParticipantsWithoutAssignments.status) {
      console.log(`Designação possui participantes sem atribuições`);
      throw new Exception(400, hasParticipantsWithoutAssignments.message);
    }
    console.log(`Designação não possui participantes sem atribuições`);

    console.log(`Procurando capitão`);
    let captain = designation.participants.find((p) => p.profile === "CAPTAIN");
    if (!captain) {
      console.log(`Capitão não encontrado`);
      captain = designation.assignments.find((a) => a.participants.find((p) => p.profile === "CAPTAIN"))?.participants.find((p) => p.profile === "CAPTAIN");
    }
    console.log(`Capitão encontrado: ${captain?.name}`);

    console.log(`Verificando se a designação está aberta ou em andamento`);
    if (designation.status !== DesignationStatus.OPEN) {
      console.log(`Designação ${designation.status}`);
      throw new Exception(400, `Designação ${designation.status}`);
    }

    console.log(`Enviando mensagens`);
    const participants: Participant[] = [];
    for (const assignment of designation.assignments) {
      if (assignment.participants.length === 0) continue;
      if (!assignment.point.status) continue;

      for (const participant of assignment.participants) {
        participants.push(participant);
      }
    }

    participants.push(...designation.participants.filter((participant) => participant.profile !== ParticipantProfile.PARTICIPANT && participant?.incident_history?.status !== IncidentStatus.OPEN));

    for (const participant of participants) {
      const message = getMessage(designation, participant, captain);
      console.log(`Enviando mensagem para ${participant.name} - ${participant.phone} tipo: ${designation.status}`);
      if (participant.phone.includes("FAKE")) {
        continue;
      }

      await whatsaapService
        .sendMessage({
          phone: participant.phone,
          message,
          title: "*TPE Digital - Designação*",
          linkUrl: `${process.env.FRONTEND_URL}/week-designation/${participant.id}`,
          linkDescription: "Clique aqui para acessar a designação",
        })
        .catch((error) => {
          console.log(`Erro ao enviar mensagem para ${participant.name} - ${participant.phone}`);
          console.error(error);
        });
      console.log(`Mensagem enviada para ${participant.name} - ${participant.phone} com sucesso`);
    }

    designation.updateStatus(DesignationStatus.IN_PROGRESS);

    await sendUpdateDesignation.execute(designation);

    return ResponseHandler.success({ message: "Designação enviada com sucesso" });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};

function getMessage(designation: Designation, participant: Participant, captain: Participant | undefined) {
  return `*Grupo de Designação: ${designation.group.name}*

Olá, ${participant.name}, 

Você está designado para ${Weekday_PT_BR[designation.group.config.weekday]}, das *${designation.group.config.startHour} às ${designation.group.config.endHour}*.

Para acessar a designação, acesse o link: ${process.env.FRONTEND_URL}/week-designation/${participant.id}

Se surgirem dúvidas ou preocupações, não hesite em entrar em contato com o capitão ${captain ? `${captain?.name} pelo telefone ${captain?.phone}` : ""}.

Atenciosamente,
TPE - Digital.
`;
}

function getMessageInProgress(designation: Designation, participant: Participant, captain: Participant | undefined) {
  return `*Grupo de Designação: ${designation.group.name}*

Olá, ${participant.name},

A designação para ${Weekday_PT_BR[designation.group.config.weekday]} já está em andamento.

Para acessar as ultimas informações, acesse o link: ${process.env.FRONTEND_URL}/week-designation/${participant.id}

Se surgirem dúvidas ou preocupações, não hesite em entrar em contato com o capitão ${captain ? `${captain?.name} pelo telefone ${captain?.phone}` : ""}.

Atenciosamente,
TPE - Digital.
`;
}
