import { Weekday_PT_BR } from "./../../enums/Weekday";
import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { DesignationRepository } from "../../repositories/DesignationRepository";
import { WhatsAppService } from "../../services/WhatsAppService";
import { Z_APIWhatsAppAdapter } from "../../infra/adapter/Z_APIWhatsAppAdapter";
import { ParticipantSex } from "../../enums/ParticipantSex";
import { Exception } from "../../shared/Exception";

const designationRepository = new DesignationRepository();
const whatsaapService = new WhatsAppService(new Z_APIWhatsAppAdapter());

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const designationId = _event.pathParameters?.designationId;
    if (!designationId) {
      return ResponseHandler.error({ message: "Parâmetros inválidos" });
    }

    const designation = await designationRepository.findByDesignationId(designationId);

    // if (designation.isParticipantsWithoutAssignments()) {
    //   throw new Exception(400, "Existem participantes sem designações");
    // }

    const captain = designation.participants.find((p) => p.profile === "CAPTAIN");

    for (const assignment of designation.assignments) {
      for (const participant of assignment.participants) {
        const sexEmoticon = (sex: ParticipantSex) => (sex === ParticipantSex.MALE ? "🧑🏻‍💼" : "👩🏻‍💼");
        const message = `*Grupo de Designação: ${designation.group.name}*

Olá, ${participant.name}, 

Você está designado para ${Weekday_PT_BR[designation.group.config.weekday]}, das *${designation.group.config.startHour} às ${designation.group.config.endHour}*.

*Detalhes da Designação:*
- Ponto: ${assignment.point.name}
- Carrinhos: ${assignment.publication_carts.map((c) => c.name).join(", ")}
- Companheiros: ${assignment.participants.map((p) => `${p.name}(${sexEmoticon(p.sex)})`).join(" / ")}

Se surgirem dúvidas ou preocupações, não hesite em entrar em contato com o capitão ${captain?.name} pelo telefone ${captain?.phone}.

Atenciosamente,
TPE - Digital.
`;
        if (participant.phone.includes("FAKE")) {
          continue;
        }
        await whatsaapService.sendMessage({ to: participant.phone, message });
      }
    }

    return ResponseHandler.success({ message: "Designação atualizada com sucesso", designation });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
