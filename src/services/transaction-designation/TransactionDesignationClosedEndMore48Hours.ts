import { DesignationStatus, Designations, GroupStatus } from "@prisma/client";
import { prisma } from "infra/prismaClient";
import { DesignationRepository } from "repositories/DesignationRepository";
import { CreateDesignationUseCase } from "services/CreateDesignationUseCase";
import { SQSMessageDispatcher } from "services/SQSMessageDispatcher";
import { MessageGenerator, MessageType } from "services/MessageGenerator";

const designationRepository = new DesignationRepository();
const sqsDispatcher = new SQSMessageDispatcher();
const messageGenerator = new MessageGenerator();
const createDesignationUseCase = new CreateDesignationUseCase();

export async function TransactionDesignationClosedEndMore48Hours(designationClosed: Designations) {
  console.log(`[TRANSACAO-DESIGNACAO] Designação ${designationClosed.id} encerrada há mais de 48h. Iniciando arquivamento.`);
  console.log("[TRANSACAO-DESIGNACAO] Alterando status para ARCHIVED...");

  const group = await prisma.groups.findUnique({
    where: { id: designationClosed.groupId },
    select: { status: true, name: true }
  });

  if (group?.status === GroupStatus.CLOSED) {
    console.log(`[TRANSACAO-DESIGNACAO] O Grupo '${group.name}' está FECHADO. A designação será arquivada, mas nenhuma nova designação será criada.`);
  }

  await prisma.designations.update({
    where: {
      id: designationClosed.id,
    },
    data: {
      status: DesignationStatus.ARCHIVED,
      updatedAt: new Date(),
    },
  });

  if (group?.status !== GroupStatus.CLOSED) {
    const designation = await designationRepository.findByDesignationId(designationClosed.id);

    console.log("[TRANSACAO-DESIGNACAO] Gerando nova designação automática.");
    await createDesignationUseCase.execute(designation.group.id);

    console.log(`[TRANSACAO-DESIGNACAO] Notificando ${designation.captainsAndCoordinators.length} coordenadores sobre o arquivamento via SQS.`);

    const messages = designation.captainsAndCoordinators.map((coordinator) => {
      const message = messageGenerator.generate(MessageType.ARCHIVE_NOTIFICATION, {
        recipientName: coordinator.name,
        details: designation.group.name,
      });

      return {
        phone: coordinator.phone,
        message,
        title: `${designation.group.name} - Designação Encerrada`,
        footer: "TPE Digital",
        linkUrl: process.env.FRONTEND_URL,
        linkDescription: "Acessar Sistema",
        type: "text" as const
      };
    });

    await sqsDispatcher.dispatchBatch(messages).catch((error) => {
      console.error(`[TRANSACAO-DESIGNACAO] Erro ao enfileirar notificações de arquivamento:`, error);
    });
  } else {
    console.log("[TRANSACAO-DESIGNACAO] Nova designação e notificações ignoradas pois o grupo está FECHADO.");
  }
}
