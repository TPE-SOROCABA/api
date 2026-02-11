import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { DesignationRepository } from "../../repositories/DesignationRepository";
import { BadRequestException, ForbiddenException } from "shared/Exception";
import { SendUpdateDesignation } from "services/SendUpdateDesignation";
import { ParticipantProfile } from "../../enums/ParticipantProfile";

const designationRepository = new DesignationRepository();
const sendUpdateDesignation = new SendUpdateDesignation();

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
    const responseHandler = new ResponseHandler(_event);
    try {
        const designationId = _event.pathParameters?.designationId;

        if (!designationId) {
            console.log(`[REOPEN-DESIGNATION] Erro: designationId não fornecido.`);
            throw new BadRequestException("Parâmetros inválidos");
        }

        console.log(`[REOPEN-DESIGNATION] Iniciando reabertura da designação ${designationId}.`);
        const designation = await designationRepository.findByDesignationId(designationId);

        // Validate current status
        if (designation.status !== "CANCELLED") {
            console.log(`[REOPEN-DESIGNATION] Designação não está cancelada. Status atual: ${designation.status}`);
            throw new BadRequestException("Apenas designações canceladas podem ser reabertas.");
        }

        designation.reopenDesignation();
        await sendUpdateDesignation.execute(designation);

        console.log(`[REOPEN-DESIGNATION] Designação ${designationId} reaberta com sucesso.`);

        return responseHandler.success(designation.toJson());
    } catch (error) {
        return responseHandler.error(error);
    }
};
