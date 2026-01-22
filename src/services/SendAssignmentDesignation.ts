import { Designation, Participant } from "domain/Designation";
import { BadRequestException } from "shared/Exception";
import { DesignationStatus, IncidentStatus, ParticipantProfile } from "@prisma/client";
import { Weekday_PT_BR } from "src/enums/Weekday";
import { DesignationStatusPT_BR } from "enums/DesignationStatusPT_BR";
import { ParticipantsNotAssignment } from "domain/DesignationRulesValidation/ParticipantsNotAssignment";
import { MessageGenerator, MessageType } from "./MessageGenerator";
import { SQSMessageDispatcher, QueueMessagePayload } from "./SQSMessageDispatcher";
import { ShortLinkService } from "./ShortLinkService";

const messageGenerator = new MessageGenerator();
const sqsDispatcher = new SQSMessageDispatcher();
const shortLinkService = new ShortLinkService();

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

  const frontendUrl = process.env.FRONTEND_URL || 'https://app.tpedigital.com.br';
  const apiUrl = process.env.API_URL || 'https://api.tpedigital.com.br/dev';

  console.log(`[ENVIO-DESIGNACAO] Encurtando links para envio em modo texto...`);
  const shortGeneralLink = await shortLinkService.shorten(`${frontendUrl}/designacao/${designation.id}`);
  const shortMyLink = await shortLinkService.shorten(`${apiUrl}/public/start/${designation.id}`);

  const message = messageGenerator.generate(MessageType.INVITATION_GROUP_TEXT, {
    recipientName: "Equipe",
    details: `${Weekday_PT_BR[designation.group.config.weekday]}, das *${designation.group.config.startHour} às ${designation.group.config.endHour}*`,
    generalLink: shortGeneralLink,
    loginLink: shortMyLink
  });

  console.log(`[ENVIO-DESIGNACAO] Gerando links encurtados: GERAL=${shortGeneralLink}, MINHA=${shortMyLink}`);

  const payload: QueueMessagePayload = {
    phone: designation.group.whatsappId,
    message,
    type: "text",
    title: `${designation.group.name} - Designação`,
    footer: "TPE Digital"
  };
  console.log(`[ENVIO-DESIGNACAO] Montando payload (TEXTO) para SQS: ${JSON.stringify(payload, null, 2)}`);
  await sqsDispatcher.dispatch(payload);
  console.log(`[ENVIO-DESIGNACAO] Notificação de grupo enviada para processamento em modo texto.`);
}
