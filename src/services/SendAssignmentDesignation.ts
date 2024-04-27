import { Z_APIWhatsAppAdapter } from "infra/adapter/Z_APIWhatsAppAdapter";
import { WhatsAppService } from "./WhatsAppService";
import { Designation, Participant } from "domain/Designation";
import { BadRequestException } from "shared/Exception";
import { DesignationStatus, IncidentStatus, ParticipantProfile } from "@prisma/client";
import { Weekday_PT_BR } from "src/enums/Weekday";
import { DesignationStatusPT_BR } from "enums/DesignationStatusPT_BR";

const whatsaapService = new WhatsAppService(new Z_APIWhatsAppAdapter());

export async function SendAssignmentDesignation(designation: Designation) {
  console.log(`Verificando se a designação possui participantes sem atribuições`);
  const hasParticipantsWithoutAssignments = designation.isParticipantsWithoutAssignments();
  if (hasParticipantsWithoutAssignments.status) {
    console.log(`Designação possui participantes sem atribuições`);
    throw new BadRequestException( hasParticipantsWithoutAssignments.message);
  }
  console.log(`Designação não possui participantes sem atribuições`);

  console.log(`Verificando se a designação está aberta ou em andamento`);
  if (designation.status !== DesignationStatus.OPEN) {
    console.log(`Designação ${designation.status}`);
    throw new BadRequestException( `Designação não pode ser enviada, pois está ${DesignationStatusPT_BR[designation.status]}`);
  }

  let captain = designation.captainsAndCoordinators.find((participant) => participant.profile === ParticipantProfile.CAPTAIN);
  if (!captain) {
    captain = designation.captainsAndCoordinators.find((participant) => participant.profile === ParticipantProfile.COORDINATOR);
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
        linkUrl: `${process.env.FRONTEND_URL}/week-designation/${designation.id}/${participant.id}`,
        linkDescription: "Clique aqui para acessar a designação",
      })
      .catch((error) => {
        console.log(`Erro ao enviar mensagem para ${participant.name} - ${participant.phone}`);
        console.error(error);
      });
    console.log(`Mensagem enviada para ${participant.name} - ${participant.phone} com sucesso`);
  }
}

function getMessage(designation: Designation, participant: Participant, captain: Participant | undefined) {
  return `*Grupo de Designação: ${designation.group.name}*
  
  Olá, ${participant.name}, 
  
  Você está designado para ${Weekday_PT_BR[designation.group.config.weekday]}, das *${designation.group.config.startHour} às ${designation.group.config.endHour}*.
  
  Para acessar a designação, clique no link abaixo.
  
  Se surgirem dúvidas ou preocupações, não hesite em entrar em contato com o capitão ${captain ? `${captain?.name} pelo telefone ${captain?.phone}` : ""}.
  
  Atenciosamente,
  TPE - Digital.
  `;
}
