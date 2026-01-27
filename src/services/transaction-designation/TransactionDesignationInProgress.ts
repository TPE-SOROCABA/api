import { DesignationStatus, Designations } from "@prisma/client";
import { ParticipantProfile } from "enums/ParticipantProfile";
import { prisma } from "infra/prismaClient";
import { DesignationRepository } from "repositories/DesignationRepository";
import { SQSMessageDispatcher } from "services/SQSMessageDispatcher";
import { MessageGenerator, MessageType } from "services/MessageGenerator";

const designationRepository = new DesignationRepository();
const sqsDispatcher = new SQSMessageDispatcher();
const messageGenerator = new MessageGenerator();

export async function TransactionDesignationInProgress(designationInProgress: Designations) {
  console.log(`[TRANSACAO-DESIGNACAO] Designação ${designationInProgress.id} entrando em conclusão.`);
  console.log("[TRANSACAO-DESIGNACAO] Alterando status para CLOSED...");
  await prisma.designations.update({
    where: {
      id: designationInProgress.id,
    },
    data: {
      status: DesignationStatus.CLOSED,
      updatedAt: new Date(),
    },
  });
  const designation = await designationRepository.findByDesignationId(designationInProgress.id, true);

  const participants = designation.participants.map((participant) => participant);
  const participantesAssignments = designation.assignments.map((assignment) => assignment.participants.map((participant) => participant)).flat();
  const participantIncidents = designation.incidents.map((incident) => incident);
  const participantsNotify = [...participants, ...participantesAssignments, ...participantIncidents].filter(
    (participant) => participant.incident_history
  );

  if (participantsNotify.length > 0) {
    console.log(
      `[TRANSACAO-DESIGNACAO] Detectados ${participantsNotify.length} participantes pendentes de justificativa. Enviando notificação coletiva.`
    );

    const shortLink = await prisma.shortLink.findFirst({
      where: {
        originalUrl: {
          contains: `public/start/${designationInProgress.id}`,
        },
      },
    });

    if (!shortLink) {
      console.error(
        `[TRANSACAO-DESIGNACAO] Erro ao recuperar link encurtado para designação ${designationInProgress.id}. Notificações de justificativa não serão enviadas.`
      );
      return;
    }

    const domain = process.env.SHORT_LINK_DOMAIN || "https://go.tpedigital.com.br";
    const loginLink = `${domain}/s/${shortLink.code}`;

    const recipientPhones: string[] = [];
    if (designation.group.whatsappId) {
      recipientPhones.push(designation.group.whatsappId);
    } else {
      const captains = designation.captainsAndCoordinators;
      const uniquePhones = [...new Set(captains.map((p) => p.phone).filter((phone) => !!phone))];
      recipientPhones.push(...uniquePhones);
    }

    if (recipientPhones.length > 0) {
      const genericMessage = messageGenerator.generate(MessageType.COMPLETED_NOTIFICATION, {
        recipientName: "Equipe",
        details: designation.group.name,
        loginLink,
      });

      const messages = recipientPhones.map((phone) => ({
        phone: phone,
        message: genericMessage,
        title: `${designation.group.name} - Designação Concluída`,
        footer: "TPE Digital",
        type: "text" as const,
      }));

      await sqsDispatcher.dispatchBatch(messages).catch((error) => {
        console.error(`[TRANSACAO-DESIGNACAO] Erro ao enfileirar notificações de conclusão coletiva:`, error);
      });
    } else {
      console.log(`[TRANSACAO-DESIGNACAO] Nenhum destinatário (grupo ou capitão) encontrado para a notificação coletiva.`);
    }
  }

  console.log("[TRANSACAO-DESIGNACAO] Fluxo de conclusão finalizado.");
}
