import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { DesignationRepository } from "../../repositories/DesignationRepository";
import { WhatsAppService } from "../../services/WhatsAppService";
import { Z_APIWhatsAppAdapter } from "../../infra/adapter/Z_APIWhatsAppAdapter";
import { Weekday_PT_BR } from "../../enums/Weekday";
import { DesignationStatus } from "@prisma/client";
import { BadRequestException } from "shared/Exception";
import { SendUpdateDesignation } from "services/SendUpdateDesignation";

const designationRepository = new DesignationRepository();
const whatsaapService = new WhatsAppService(new Z_APIWhatsAppAdapter());
const sendUpdateDesignation = new SendUpdateDesignation();

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  const responseHandler = new ResponseHandler(_event);
  try {
    const designationId = _event.pathParameters?.designationId;
    const body = JSON.parse(_event.body || "{}");
    if (!designationId || !body?.justification) {
      throw new BadRequestException("Parâmetros inválidos");
    }

    const designation = await designationRepository.findByDesignationId(designationId);
    designation.cancelDesignation(body.justification);
    await sendUpdateDesignation.execute(designation);

    console.log(`Procurando capitão`);
    let captain = designation.participants.find((p) => p.profile === "CAPTAIN");
    if (!captain) {
      console.log(`Capitão não encontrado`);
      captain = designation.assignments.find((a) => a.participants.find((p) => p.profile === "CAPTAIN"))?.participants.find((p) => p.profile === "CAPTAIN");
    }
    console.log(`Capitão encontrado: ${captain?.name}`);

    for (const assignment of designation.assignments) {
      for (const participant of assignment.participants) {
        const message = `Olá, ${participant.name}, 

A designação para ${Weekday_PT_BR[designation.group.config.weekday]}, das *${designation.group.config.startHour} às ${designation.group.config.endHour}*, foi CANCELADA.

Qualquer dúvida, entre em contato com o capitão do seu grupo.`;

        if (participant.phone.includes("FAKE")) {
          continue;
        }

        await whatsaapService.sendButtonMessage({
          phone: participant.phone,
          message,
          title: `${designation.group.name} - Designação Cancelada`,
          footer: "TPE - Digital.",
          buttonActions: [
            {
              id: "1",
              type: "REPLY",
              label: "Entendido"
            }
          ]
        });
      }
    }
    return responseHandler.success(designation.toJson());
  } catch (error) {
    return responseHandler.error(error);
  }
};
