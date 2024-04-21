import type { Context, SQSHandler } from "aws-lambda";
import { DesignationRepository } from "../../repositories/DesignationRepository";
import { Designation } from "../../domain/Designation";

const designationRepository = new DesignationRepository();

export const handler: SQSHandler = async (_event, _context: Context) => {
  try {
    for (const record of _event.Records) {
      const designation = JSON.parse(record.body) as Designation;

      console.log(`Designation: ${designation.group.name} - ${designation.id}`);

      await designationRepository.update(designation);
    }
  } catch (error) {
    console.log(`Erro ao atualizar designações: ${error}`);
  }
};
