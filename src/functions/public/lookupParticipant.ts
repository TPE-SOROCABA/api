import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { JsonHandler } from "../../shared/JsonHandler";
import { BadRequestException, NotFoundException } from "../../shared/Exception";
import { DesignationRepository } from "../../repositories/DesignationRepository";
import { PhoneUtils } from "../../shared/PhoneUtils";

const designationRepository = new DesignationRepository();

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
    const responseHandler = new ResponseHandler(_event);
    try {
        const designationId = _event.pathParameters?.designationId;
        const body = JsonHandler.parse<{ phone: string }>(_event.body);

        if (!designationId || !body.phone) {
            throw new BadRequestException("Parâmetros inválidos");
        }

        const designation = await designationRepository.findByDesignationId(designationId);
        if (!designation) {
            throw new NotFoundException("Designação não encontrada");
        }

        const normalizedTargetPhone = PhoneUtils.normalize(body.phone);

        // Procura nos participantes da designação (participantes do grupo que não estão em incidente)
        let foundParticipant = designation.participants.find(p => PhoneUtils.normalize(p.phone) === normalizedTargetPhone);

        // Se não encontrou, procura nos participantes já atribuídos
        if (!foundParticipant) {
            for (const assignment of designation.assignments) {
                const p = assignment.participants.find(p => PhoneUtils.normalize(p.phone) === normalizedTargetPhone);
                if (p) {
                    foundParticipant = p;
                    break;
                }
            }
        }

        // Se não encontrou, procura também nos que estão com incidente (se estiverem acessíveis via repo)
        // No DesignationRepository.ts, incidents também são carregados mas são movidos para a lista de incidentes no setup()
        if (!foundParticipant) {
            foundParticipant = designation.incidents.find(p => PhoneUtils.normalize(p.phone) === normalizedTargetPhone);
        }

        if (!foundParticipant) {
            throw new NotFoundException("Participante não encontrado nesta designação");
        }

        return responseHandler.success({
            participantId: foundParticipant.id,
            name: foundParticipant.name
        });
    } catch (error) {
        return responseHandler.error(error);
    }
};
