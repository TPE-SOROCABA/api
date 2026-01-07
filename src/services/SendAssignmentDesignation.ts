import { Designation, Participant } from "domain/Designation";
import { BadRequestException } from "shared/Exception";
import { DesignationStatus, IncidentStatus, ParticipantProfile } from "@prisma/client";
import { Weekday_PT_BR } from "src/enums/Weekday";
import { DesignationStatusPT_BR } from "enums/DesignationStatusPT_BR";
import { ParticipantsNotAssignment } from "domain/DesignationRulesValidation/ParticipantsNotAssignment";
import { MessageGenerator, MessageType } from "./MessageGenerator";
import { SQSMessageDispatcher, QueueMessagePayload } from "./SQSMessageDispatcher";

const messageGenerator = new MessageGenerator();
const sqsDispatcher = new SQSMessageDispatcher();

export async function SendAssignmentDesignation(designation: Designation) {
  console.log(`[ENVIO-DESIGNACAO] Validando designação ${designation.id} para envio.`);
  const participantsNotAssignment = new ParticipantsNotAssignment();
  designation.addValidationPlugin(participantsNotAssignment);
  designation.applyValidations();
  console.log(`[ENVIO-DESIGNACAO] Validação de atribuições concluída.`);

  console.log(`[ENVIO-DESIGNACAO] Verificando status da designação...`);
  if (designation.status !== DesignationStatus.OPEN) {
    console.log(`[ENVIO-DESIGNACAO] Abortando: Status atual é ${designation.status}.`);
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
  console.log(`[ENVIO-DESIGNACAO] Preparando notificações para ${participants.length} participantes via SQS.`);

  const messages: Omit<QueueMessagePayload, 'scheduledAt'>[] = [];

  for (const participant of participants) {
    if (participant.phone.includes("FAKE")) {
      continue;
    }

    const message = messageGenerator.generate(MessageType.INVITATION, {
      recipientName: participant.name,
      details: `${Weekday_PT_BR[designation.group.config.weekday]}, das *${designation.group.config.startHour} às ${designation.group.config.endHour}*`
    });

    messages.push({
      phone: participant.phone,
      message,
      title: `${designation.group.name} - Designação`,
      footer: "TPE Digital",
      type: "button",
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
    });
  }

  if (messages.length > 0) {
    await sqsDispatcher.dispatchBatch(messages);
    console.log(`[ENVIO-DESIGNACAO] ${messages.length} mensagens enviadas para processamento assíncrono.`);
  }
}
