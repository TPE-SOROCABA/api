import { Weekday_PT_BR } from "./../../enums/Weekday";
import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { DesignationRepository } from "../../repositories/DesignationRepository";
import { WhatsAppService } from "../../services/WhatsAppService";
import { Z_APIWhatsAppAdapter } from "../../infra/adapter/Z_APIWhatsAppAdapter";
import { ParticipantSex } from "../../enums/ParticipantSex";
import { Exception } from "../../shared/Exception";
import { Designation, Participant, Assignments } from "../../domain/Designation";
import { WeekDesignationModel } from "../../repositories/models/WeekDesignationModel";
import { DesignationStatus } from "../../enums/DesignationStatus";
import { DesignationModel } from "../../repositories/models/DesignationModel";

const designationRepository = new DesignationRepository();
const whatsaapService = new WhatsAppService(new Z_APIWhatsAppAdapter());

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const designationId = _event.pathParameters?.designationId;
    if (!designationId) {
      return ResponseHandler.error({ message: "Parâmetros inválidos" });
    }

    const designation = await designationRepository.findByDesignationId(designationId);

    if (designation.isParticipantsWithoutAssignments()) {
      throw new Exception(400, "Existem participantes sem designações");
    }

    const captain = designation.participants.find((p) => p.profile === "CAPTAIN");

    if (designation.status === DesignationStatus.IN_PROGRESS){
      throw new Exception(400, `Designação já está em progresso`);
    }
    
    if (designation.status !== DesignationStatus.OPEN){
      throw new Exception(400, `Designação ${designation.status}`);
    }
    
    await WeekDesignationModel.deleteMany({
      designation: designation.id,
    });

    for (const assignment of designation.assignments) {
      if (assignment.participants.length === 0) continue;
      if (!assignment.point.status) continue;

      await WeekDesignationModel.create({
        designation: designation.id,
        participants: assignment.participants.map((p) => p.id),
        point: assignment.point.id,
        publication_carts: assignment.publication_carts.map((c) => c.id),
        expirationDate: designation.getNextDate(),
      })

      for (const participant of assignment.participants) {
        const message = getMessage(designation, participant, captain);
        if (participant.phone.includes("FAKE")) {
          continue;
        }
        await whatsaapService.sendMessage({ to: participant.phone, message, link: `${process.env.FRONTEND_URL}/designar/${participant.id}` });
      }
    }

    await DesignationModel.updateOne({ _id: designation.id }, { status: DesignationStatus.IN_PROGRESS });

    return ResponseHandler.success({ message: "Designação enviada com sucesso" });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};

function getMessage(designation: Designation, participant: Participant, captain: Participant | undefined) {
  return `*Grupo de Designação: ${designation.group.name}*

Olá, ${participant.name}, 

Você está designado para ${Weekday_PT_BR[designation.group.config.weekday]}, das *${designation.group.config.startHour} às ${designation.group.config.endHour}*.

Para mais informações, acesse o link: ${process.env.FRONTEND_URL}/week-designation/${participant.id}

Se surgirem dúvidas ou preocupações, não hesite em entrar em contato com o capitão ${captain ? `${captain?.name} pelo telefone ${captain?.phone}` :""}.

Atenciosamente,
TPE - Digital.
`;
}
