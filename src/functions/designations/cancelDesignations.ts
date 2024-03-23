import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { DesignationModel } from "../../repositories/models/DesignationModel";77
import { DesignationStatus } from "../../enums/DesignationStatus";
import { connectToDatabase } from "../../infra/connectToDatabase";
import { DesignationRepository } from "../../repositories/DesignationRepository";
import { WhatsAppService } from "../../services/WhatsAppService";
import { Z_APIWhatsAppAdapter } from "../../infra/adapter/Z_APIWhatsAppAdapter";
import { Weekday_PT_BR } from "../../enums/Weekday";

const designationRepository = new DesignationRepository();
const whatsaapService = new WhatsAppService(new Z_APIWhatsAppAdapter());

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();
    const designationId = _event.pathParameters?.designationId;
    if (!designationId) {
      return ResponseHandler.error({ message: "Parâmetros inválidos" });
    }

    await DesignationModel.updateOne(
      {
        _id: designationId,
      },
      { status: DesignationStatus.CANCELLED, updatedAt: new Date() }
    );

    const designation = await designationRepository.findByDesignationId(designationId);
    const captain = designation.participants.find((p) => p.profile === "CAPTAIN");

    for (const assignment of designation.assignments) {
      for (const participant of assignment.participants) {
        const message = `*Grupo de Designação: ${designation.group.name}*

Olá, ${participant.name}, 

A designação para ${Weekday_PT_BR[designation.group.config.weekday]}, das *${designation.group.config.startHour} às ${designation.group.config.endHour}* foi cancelada.

Se surgirem dúvidas ou preocupações, não hesite em entrar em contato com o capitão ${captain?.name} pelo telefone ${captain?.phone}.

Atenciosamente,
TPE - Digital.
`;
        if(participant.phone.includes("FAKE")) {
          continue;
        }
        await whatsaapService.sendMessage({ to: participant.phone, message });
      }
    }
    return ResponseHandler.success({ message: "Designação cancelada com sucesso!" });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
