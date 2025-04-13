import { DesignationStatus, Designations } from "@prisma/client";
import { ParticipantProfile } from "enums/ParticipantProfile";
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

  const participants = designation.participants.map((participant) => participant);
  const participantesAssignments = designation.assignments.map((assignment) => assignment.participants.map((participant) => participant)).flat();
  const participantsNotify = [...participants, ...participantesAssignments];
  console.log("Enviando notificação de conclusão de designação para os participantes");

  for (const participant of participantsNotify) {
    try {
      if (participant.profile === ParticipantProfile.COORDINATOR || participant.profile === ParticipantProfile.CAPTAIN) {
        await whatsaapService
          .sendMessage({
            phone: participant.phone,
            message: `*Atenção capitão!*
  
A designação ${designation.group.name} foi CONCLUÍDA.
Os participantes terão 48 horas para justificar a ausência desta semana.
  
TPE Digital!`,
            title: "*TPE Digital - Designação Concluída*",
            linkUrl: `${process.env.FRONTEND_URL}/designacao/${designation.id}/${participant.id}`,
            linkDescription: "Clique aqui para justificar a ausência",
          })
          .catch((error) => {
            console.error(`Erro ao enviar notificação de designação para ${participant.name}`, error);
          });
      } else {
        await whatsaapService
          .sendMessage({
            phone: participant.phone,
            message: `Olá, ${participant.name}!
  
A designação ${designation.group.name} foi CONCLUÍDA.
Os participantes terão 48 horas para justificar a ausência desta semana.
  
*Por favor, desconsidere essa mensagem se você esteve presente na designação. Nesse caso, nenhuma justificativa é necessária.*
  
TPE Digital!`,
            title: "*TPE Digital - Designação Concluída*",
            linkUrl: `${process.env.FRONTEND_URL}/designacao/${designation.id}/${participant.id}`,
            linkDescription: "Clique aqui para justificar a ausência",
          })
          .catch((error) => {
            console.error(`Erro ao enviar notificação de designação para ${participant.name}`, error);
          });
      }
    } catch (error) {
      console.error(`Erro ao enviar notificação de designação para ${participant.name}`, error);
    }
  }

  console.log("Designação concluída com sucesso");
}
