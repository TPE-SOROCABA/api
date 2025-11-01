import { Z_APIWhatsAppAdapter } from "infra/adapter/Z_APIWhatsAppAdapter";
import { WhatsAppService } from "./WhatsAppService";
import { Designation, Participant } from "domain/Designation";
import { BadRequestException } from "shared/Exception";
import { DesignationStatus, IncidentStatus, ParticipantProfile } from "@prisma/client";
import { Weekday_PT_BR } from "src/enums/Weekday";
import { DesignationStatusPT_BR } from "enums/DesignationStatusPT_BR";
import { ParticipantsNotAssignment } from "domain/DesignationRulesValidation/ParticipantsNotAssignment";

const whatsaapService = new WhatsAppService(new Z_APIWhatsAppAdapter());

export async function SendAssignmentDesignation(designation: Designation) {
  console.log(`Verificando se a designação possui participantes sem atribuições`);
  const participantsNotAssignment = new ParticipantsNotAssignment();
  designation.addValidationPlugin(participantsNotAssignment);
  designation.applyValidations();
  console.log(`Designação não possui participantes sem atribuições`);

  console.log(`Verificando se a designação está aberta ou em andamento`);
  if (designation.status !== DesignationStatus.OPEN) {
    console.log(`Designação ${designation.status}`);
    throw new BadRequestException(`Designação não pode ser enviada, pois está ${DesignationStatusPT_BR[designation.status]}`);
  }

  const participants: Participant[] = [];
  for (const assignment of designation.assignments) {
    if (assignment.participants.length === 0) continue;
    if (!assignment.point.status) continue;

    for (const participant of assignment.participants) {
      participants.push(participant);
    }
  }

  participants.push(...designation.participants.filter((participant) => participant.profile !== ParticipantProfile.PARTICIPANT && participant?.incident_history?.status !== IncidentStatus.OPEN));
  console.log(`Enviando mensagens`);
  for (const participant of participants) {
    const message = getMessage(designation, participant);
    if (participant.phone.includes("FAKE")) {
      continue;
    }

    await whatsaapService
      .sendButtonMessage({
        phone: participant.phone,
        message,
        title: `${designation.group.name} - Designação`,
        footer: "TPE - Digital.",
        buttonActions: [
          {
            id: "1",
            type: "REPLY",
            label: "Confirmar Presença"
          },
          {
            id: "2",
            type: "URL",
            url: `${process.env.FRONTEND_URL}/designacao/${designation.id}/${participant.id}`,
            label: "Ver Detalhes"
          }
        ]
      })
      .catch((error) => {
        console.log(`Erro ao enviar mensagem para ${participant.name} - ${participant.phone}`);
        console.error(error);
      });
    console.log(`Mensagem com botões enviada para ${participant.name} - ${participant.phone} com sucesso`);
  }
}

function getMessage(designation: Designation, participant: Participant) {
  return `Olá, ${participant.name}, 
  
Você está designado para ${Weekday_PT_BR[designation.group.config.weekday]}, das *${designation.group.config.startHour} às ${designation.group.config.endHour}*.

Qualquer dúvida, entre em contato com o capitão do seu grupo.`;
}
