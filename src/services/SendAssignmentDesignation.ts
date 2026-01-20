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

  if (!designation.group.whatsappId) {
    console.log(`[ENVIO-DESIGNACAO] Grupo ${designation.group.name} sem WhatsApp ID. Nenhuma notificação será enviada.`);
    return;
  }

  console.log(`[ENVIO-DESIGNACAO] Grupo ${designation.group.name} possui WhatsApp ID: ${designation.group.whatsappId}. Preparando envio único.`);

  const message = messageGenerator.generate(MessageType.INVITATION_GROUP, {
    recipientName: "Equipe",
    details: `${Weekday_PT_BR[designation.group.config.weekday]}, das *${designation.group.config.startHour} às ${designation.group.config.endHour}*`
  });

  const frontendUrl = process.env.FRONTEND_URL || 'https://app.tpedigital.com.br';
  const apiUrl = process.env.API_URL || 'https://api.tpedigital.com.br/dev';

  console.log(`[ENVIO-DESIGNACAO] Gerando links: FRONTEND=${frontendUrl}, API=${apiUrl}`);

  const payload: QueueMessagePayload = {
    phone: designation.group.whatsappId,
    message,
    type: "button",
    buttonActions: [
      {
        id: "general_link",
        type: "URL",
        url: `${frontendUrl}/designacao/${designation.id}`,
        label: "Designação Geral"
      },
      {
        id: "my_designation",
        type: "URL",
        url: `${apiUrl}/public/start/${designation.id}`,
        label: "Minha Designação"
      }
    ],
    title: `${designation.group.name} - Designação`,
    footer: "TPE Digital"
  };
  console.log(`[ENVIO-DESIGNACAO] Montando payload para SQS: ${JSON.stringify(payload, null, 2)}`);
  await sqsDispatcher.dispatch(payload);
  console.log(`[ENVIO-DESIGNACAO] Notificação de grupo enviada para processamento com ${payload.buttonActions?.length} botões.`);
}
