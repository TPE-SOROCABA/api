import { DesignationStatus, Designations, ParticipantProfile } from "@prisma/client";
import { Z_APIWhatsAppAdapter } from "infra/adapter/Z_APIWhatsAppAdapter";
import { DesignationRepository } from "repositories/DesignationRepository";
import { SendAssignmentDesignation } from "services/SendAssignmentDesignation";
import { WhatsAppService } from "services/WhatsAppService";

const designationRepository = new DesignationRepository();
const whatsaapService = new WhatsAppService(new Z_APIWhatsAppAdapter());

export async function TransactionStatusDesignationOpenLess2Hours(designationOpen: Designations) {
  console.log(`Designação ${designationOpen.id} aberta com menos de 2 horas para o início`);
  console.log("Gerando designação automaticamente");
  const designation = await designationRepository.findByDesignationId(designationOpen.id);
  designation.generateAssignment(500);
  
  console.log("Enviando notificação de designação");
  await SendAssignmentDesignation(designation).catch(async (error) => {
    console.error("Erro ao enviar notificação de designação", error);
    designation.updateStatus(DesignationStatus.OPEN);
    await designationRepository.update(designation);
  })
  
  designation.updateStatus(DesignationStatus.IN_PROGRESS);
  await designationRepository.update(designation);

  console.log("Avise o coordenador sobre o atraso da designação");
  const coordinator = designation.captainsAndCoordinators.find((participant) => participant.profile === ParticipantProfile.COORDINATOR);
  if (coordinator) {
    await whatsaapService.sendMessage({
      phone: coordinator.phone,
      message: `Olá, a designação ${designation.group.name} foi aberta com menos de 2 horas para o início. Por favor, verifique se todos os participantes estão cientes e prontos para a designação.\n\n`,
      title: "*TPE Digital - Atraso da Designação*",
      linkUrl: `${process.env.FRONTEND_URL}/week-designation/${designation.id}`,
      linkDescription: "Clique aqui para ver a designação",
    });
  }

  console.log("Designação aberta com sucesso")
}
