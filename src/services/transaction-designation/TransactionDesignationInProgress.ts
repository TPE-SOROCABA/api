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
  const designation = await designationRepository.findByDesignationId(designationInProgress.id);

  const participants = designation.participants.map((participant) => participant);
  const participantesAssignments = designation.assignments.map((assignment) => assignment.participants.map((participant) => participant)).flat();
  const participantsNotify = [...participants, ...participantesAssignments];
  console.log(`[TRANSACAO-DESIGNACAO] Notificando ${participantsNotify.length} participantes sobre conclusão via SQS.`);

  const messages = participantsNotify.map((participant) => {
    const isCoordinatorOrCaptain = participant.profile === ParticipantProfile.COORDINATOR || participant.profile === ParticipantProfile.CAPTAIN;

    const message = messageGenerator.generate(MessageType.COMPLETED_NOTIFICATION, {
      recipientName: participant.name,
      details: designation.group.name,
    });

    return {
      phone: participant.phone,
      message,
      title: `${designation.group.name} - Designação Concluída`,
      footer: "TPE Digital",
      buttonActions: [
        {
          id: "1",
          type: "URL" as const,
          url: `${process.env.FRONTEND_URL}/designacao/${designation.id}/${participant.id}`,
          label: "Justificar Ausência"
        }
      ],
      type: "button" as const
    };
  });

  await sqsDispatcher.dispatchBatch(messages).catch((error) => {
    console.error(`[TRANSACAO-DESIGNACAO] Erro ao enfileirar notificações de conclusão:`, error);
  });

  console.log("[TRANSACAO-DESIGNACAO] Fluxo de conclusão finalizado.");
}
