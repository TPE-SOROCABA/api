import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { DesignationRepository } from "../../repositories/DesignationRepository";
import { JsonHandler } from "../../shared/JsonHandler";
import { BadRequestException, Exception } from "../../shared/Exception";
import { SendUpdateDesignation } from "../../services/SendUpdateDesignation";

const designationRepository = new DesignationRepository();
const sendUpdateDesignation = new SendUpdateDesignation();

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
    const responseHandler = new ResponseHandler(_event);
    try {
        const designationId = _event.pathParameters?.designationId;
        const body = JsonHandler.parse<{ optional: boolean }>(_event.body);

        if (!designationId) throw new BadRequestException("Parâmetros inválidos");
        if (body.optional === undefined) throw new BadRequestException("Campo optional é obrigatório");

        const designation = await designationRepository.findByDesignationId(designationId, true);
        if (!designation) throw new Exception(404, "Designação não encontrada");

        designation.setMandatoryPresence(!body.optional);
        await sendUpdateDesignation.execute(designation);

        return responseHandler.success(designation.toJson());
    } catch (error) {
        return responseHandler.error(error);
    }
};
