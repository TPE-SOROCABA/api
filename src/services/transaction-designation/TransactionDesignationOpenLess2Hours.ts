import { DesignationStatus, Designations, ParticipantProfile } from "@prisma/client";
import { Designation } from "domain/Designation";
import { prisma } from "infra/prismaClient";
import { DesignationRepository } from "repositories/DesignationRepository";
import { SendAssignmentDesignation } from "services/SendAssignmentDesignation";
import { SQSMessageDispatcher } from "services/SQSMessageDispatcher";
import { MessageGenerator, MessageType } from "services/MessageGenerator";

const designationRepository = new DesignationRepository();
const sqsDispatcher = new SQSMessageDispatcher();
const messageGenerator = new MessageGenerator();

export async function TransactionStatusDesignationOpenLess2Hours(designationOpen: Designations) {
  console.log(`[TRANSACAO-DESIGNACAO] Designação ${designationOpen.id} aberta com menos de 2 horas para o início.`);
  console.log("[TRANSACAO-DESIGNACAO] Gerando atribuições automáticas...");
  const designation = await designationRepository.findByDesignationId(designationOpen.id);
  designation.generateAssignment();

  console.log("[TRANSACAO-DESIGNACAO] Iniciando notificações de designação via SQS.");
  await SendAssignmentDesignation(designation).catch(async (error) => {
    console.error(`[TRANSACAO-DESIGNACAO] Erro ao notificar participantes:`, error);
    designation.updateStatus(DesignationStatus.OPEN);
    await designationRepository.update(designation);
  })

  designation.updateStatus(DesignationStatus.IN_PROGRESS);
  await designationRepository.update(designation);

  console.log("[TRANSACAO-DESIGNACAO] Notificando coordenador sobre o atraso.");
  const data = await getCoordinatorGroup(designation)
  if (data?.group?.coordinator) {
    const { coordinator } = data.group;
    const message = messageGenerator.generate(MessageType.COORDINATOR_ALERT, {
      recipientName: "Coordenador", // getCoordinatorGroup sub-query only retrieves phone
      details: designation.group.name,
    });

    await sqsDispatcher.dispatch({
      phone: coordinator.phone,
      message,
      title: `${designation.group.name} - Atraso da Designação`,
      footer: "TPE Digital",
      type: "text",
      linkUrl: `${process.env.FRONTEND_URL}/designacao/${designation.id}`,
      linkDescription: "Ver Detalhes",
    }).catch((error) => {
      console.error(`[TRANSACAO-DESIGNACAO] Erro ao enfileirar alerta para o coordenador:`, error);
    });
  }

  console.log("[TRANSACAO-DESIGNACAO] Processamento finalizado com sucesso.")
}

async function getCoordinatorGroup(designation: Designation) {
  return await prisma.designations.findFirst({
    where: {
      id: designation.id,
    },
    select: {
      group: {
        select: {
          coordinator: {
            select: {
              phone: true,
            },
          },
        },
      },
    },
  });
}

