import { DesignationStatus, Designations } from "@prisma/client";
import { Z_APIWhatsAppAdapter } from "infra/adapter/Z_APIWhatsAppAdapter";
import { prisma } from "infra/prismaClient";
import { DesignationRepository } from "repositories/DesignationRepository";
import { WhatsAppService } from "services/WhatsAppService";

const designationRepository = new DesignationRepository();
const whatsaapService = new WhatsAppService(new Z_APIWhatsAppAdapter());

export async function TransactionDesignationInProgress(designationInProgress: Designations) {
  console.log(`Designação ${designationInProgress.id} em andamento`);
  console.log("Encerrando designação");
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

  console.log("Enviando notificação de conclusão de designação para os coordenadores");
  for (const coordinator of designation.captainsAndCoordinators) {
    await whatsaapService
      .sendMessage({
        phone: coordinator.phone,
        message: `Olá, a designação ${designation.group.name} foi CONCLUÍDA.\nOs participantes terão 48 horas para justificar a ausência desta semana.\nTPE Digital!`,
        title: "*TPE Digital - Designação Concluída*",
        linkUrl: `${process.env.FRONTEND_URL}`,
        linkDescription: "Clique aqui para acessar o sistema",
      })
      .catch((error) => {
        console.error(`Erro ao enviar notificação de designação para ${coordinator.name}`, error);
      });
  }

  console.log("Designação concluída com sucesso");
}
