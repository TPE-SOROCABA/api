import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { DesignationRepository } from "../../repositories/DesignationRepository";
import { MessageGenerator, MessageType } from "../../services/MessageGenerator";
import { SQSMessageDispatcher, QueueMessagePayload } from "../../services/SQSMessageDispatcher";
import { Weekday_PT_BR } from "../../enums/Weekday";
import { DesignationStatus } from "@prisma/client";
import { BadRequestException } from "shared/Exception";
import { SendUpdateDesignation } from "services/SendUpdateDesignation";

const designationRepository = new DesignationRepository();
const messageGenerator = new MessageGenerator();
const sqsDispatcher = new SQSMessageDispatcher();
const sendUpdateDesignation = new SendUpdateDesignation();

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  const responseHandler = new ResponseHandler(_event);
  try {
    const designationId = _event.pathParameters?.designationId;
    const body = JSON.parse(_event.body || "{}");
    if (!designationId || !body?.justification) {
      console.log(`[ENVIO-DESIGNACAO] Erro: Parâmetros de cancelamento inválidos.`);
      throw new BadRequestException("Parâmetros inválidos");
    }

    console.log(`[ENVIO-DESIGNACAO] Iniciando cancelamento da designação ${designationId}.`);
    const designation = await designationRepository.findByDesignationId(designationId);
    designation.cancelDesignation(body.justification);
    await sendUpdateDesignation.execute(designation);

    const messages: Omit<QueueMessagePayload, 'scheduledAt'>[] = [];
    for (const assignment of designation.assignments) {
      for (const participant of assignment.participants) {
        if (participant.phone.includes("FAKE")) {
          continue;
        }

        const message = messageGenerator.generate(MessageType.CANCELLATION, {
          recipientName: participant.name,
          details: `${Weekday_PT_BR[designation.group.config.weekday]}, das *${designation.group.config.startHour} às ${designation.group.config.endHour}*`
        });

        messages.push({
          phone: participant.phone,
          message,
          title: `${designation.group.name} - Designação Cancelada`,
          footer: "TPE Digital",
          type: "button",
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

    if (messages.length > 0) {
      console.log(`[ENVIO-DESIGNACAO] Enfileirando ${messages.length} notificações de cancelamento via SQS.`);
      await sqsDispatcher.dispatchBatch(messages);
    }

    return responseHandler.success(designation.toJson());
  } catch (error) {
    return responseHandler.error(error);
  }
};
