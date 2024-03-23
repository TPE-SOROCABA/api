import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { connectToDatabase } from "../../infra/connectToDatabase";
import { InputDesignationUpdate } from "../../contracts/InputDesignationUpdate";
import { JsonHandler } from "../../shared/JsonHandler";
import { Designation } from "../../domain/Designation";
import { DesignationModel } from "../../repositories/models/DesignationModel";
import { DesignationMapper } from "../../mappers/DesignationMapper";

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    await connectToDatabase();
    const designationId = _event.pathParameters?.designationId;
    if (!designationId) {
      return ResponseHandler.error({ message: "Parâmetros inválidos" });
    }
    const body = JsonHandler.parse<Designation>(_event.body || "{}");
    await InputDesignationUpdate.create(body);

    const designation = new Designation(body.id, body.group, body.status, body.assignments, body.participants, body.createdAt, body.updatedAt);
    designation.updateAssignments(body.assignments);
    await DesignationModel.updateOne({ _id: designationId }, DesignationMapper.toPersistence(designation));
    
    return ResponseHandler.success({ message: "Designação atualizada com sucesso" });
  } catch (error) {
    return ResponseHandler.error(error);
  }
};
