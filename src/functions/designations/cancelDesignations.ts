import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { DesignationRepository } from "../../repositories/DesignationRepository";
import { WhatsAppService } from "../../services/WhatsAppService";
import { Z_APIWhatsAppAdapter } from "../../infra/adapter/Z_APIWhatsAppAdapter";
import { Weekday_PT_BR } from "../../enums/Weekday";
import { DesignationStatus } from "@prisma/client";
import { Exception } from "shared/Exception";

const designationRepository = new DesignationRepository();
const whatsaapService = new WhatsAppService(new Z_APIWhatsAppAdapter());

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    
    const designationId = _event.pathParameters?.designationId;
    const body = JSON.parse(_event.body || "{}");
    if (!designationId || !body?.justification) {
      throw new Exception(400, "Parâmetros inválidos")
    }

    const designation = await designationRepository.findByDesignationId(designationId);
    designation.cancelDesignation(body.justification);
    await designationRepository.update(designation);

    console.log(`Procurando capitão`);
    let captain = designation.participants.find((p) => p.profile === "CAPTAIN");
    if (!captain) {
      console.log(`Capitão não encontrado`);
      captain = designation.assignments.find((a) => a.participants.find((p) => p.profile === "CAPTAIN"))?.participants.find((p) => p.profile === "CAPTAIN");
    }
    console.log(`Capitão encontrado: ${captain?.name}`);

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
        await whatsaapService.sendMessage({ 
          title: "*TPE Digital - Designação Cancelada*",
          phone: participant.phone, 
          message,
          linkUrl: `${process.env.FRONTEND_URL}/week-designation/${participant.id}`,
          linkDescription: "Clique aqui para acessar a designação"
        });
      }
    }
    return ResponseHandler.success({ message: "Designação cancelada com sucesso!" });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
