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

  const day = Weekday_PT_BR[designation.group.config.weekday];

  const loginLink = `${process.env.API_URL}/public/start/${designation.id}`;

  const message = messageGenerator.generate(MessageType.INVITATION_GROUP, {
    recipientName: "Equipe",
    details: day,
    loginLink
  });

  const payload: QueueMessagePayload = {
    phone: designation.group.whatsappId,
    message,
    type: "button",
    buttonActions: [
      {
        id: "general_link",
        type: "URL",
        url: `${process.env.FRONTEND_URL}/designacao/${designation.id}`,
        label: "Designação Geral"
      },
      {
        id: "my_designation",
        type: "URL",
        url: loginLink,
        label: "Minha Designação"
      }
    ],
    title: `${designation.group.name} - Designação`
  };

  await sqsDispatcher.dispatch(payload);
  console.log(`[ENVIO-DESIGNACAO] Notificação de grupo enviada para processamento.`);
}
