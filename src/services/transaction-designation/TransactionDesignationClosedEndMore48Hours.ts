import { DesignationStatus, Designations } from "@prisma/client";
import { Z_APIWhatsAppAdapter } from "infra/adapter/Z_APIWhatsAppAdapter";
import { prisma } from "infra/prismaClient";
import { DesignationRepository } from "repositories/DesignationRepository";
import { CreateDesignationUseCase } from "services/CreateDesignationUseCase";
import { WhatsAppService } from "services/WhatsAppService";

const designationRepository = new DesignationRepository();
const whatsaapService = new WhatsAppService(new Z_APIWhatsAppAdapter());
const createDesignationUseCase = new CreateDesignationUseCase();

export async function TransactionDesignationClosedEndMore48Hours(designationClosed: Designations) {
  console.log(`Designação ${designationClosed.id} encerrada com mais de 48 horas`);
  console.log("Arquivando designação");
  await prisma.designations.update({
    where: {
      id: designationClosed.id,
    },
    data: {
      status: DesignationStatus.ARCHIVED,
      updatedAt: new Date(),
    },
  });

  const designation = await designationRepository.findByDesignationId(designationClosed.id);

  console.log("Enviando notificação de encerramento de designação para os coordenadores");
  for (const coordinator of designation.captainsAndCoordinators) {
    await whatsaapService
      .sendMessage({
        phone: coordinator.phone,
        message: `Olá, a designação do grupo ${designation.group.name} foi ENCERRADA.\nAgora é possível realizar novas designações.\nObs: O publicadores não podem mais justificar a ausência desta semana.\n\nTPE Digital!\n\n`,
        title: "*TPE Digital - Designação Encerrada*",
        linkUrl: `${process.env.FRONTEND_URL}`,
        linkDescription: "Clique aqui para acessar o sistema",
      })
      .catch((error) => {
        console.error(`Erro ao enviar notificação de designação para ${coordinator.name}`, error);
      });
  }
  
  console.log("Criando nova designação"); 
  await createDesignationUseCase.execute(designation.group.id);
  
  console.log("Enviando notificação de nova designação para os coordenadores");
  for (const coordinator of designation.captainsAndCoordinators) {
    await whatsaapService
      .sendMessage({
        phone: coordinator.phone,
        message: `Olá, uma nova designação foi criada para o grupo ${designation.group.name}.\n\nAgora é possível realizar novas designações.\n\nTPE Digital!\n\n`,
        title: "*TPE Digital - Nova Designação*",
        linkUrl: `${process.env.FRONTEND_URL}`,
        linkDescription: "Clique aqui para acessar o sistema",
      })
      .catch((error) => {
        console.error(`Erro ao enviar notificação de designação para ${coordinator.name}`, error);
      });
  }

  console.log("Designação arquivada com sucesso");
}
