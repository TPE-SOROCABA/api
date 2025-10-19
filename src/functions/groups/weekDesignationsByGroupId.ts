import { DesignationRepository } from "../../repositories/DesignationRepository";
import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { SendUpdateDesignation } from "../../services/SendUpdateDesignation";
import { BadRequestException } from "shared/Exception";
import { Designation } from "domain/Designation";

const designationRepository = new DesignationRepository();
const sendUpdateDesignation = new SendUpdateDesignation();

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  const responseHandler = new ResponseHandler(_event);
  try {
    const groupId = _event.pathParameters?.groupId;
    const random = _event.queryStringParameters?.random;
    const filter = _event.queryStringParameters?.filter;
    if (!groupId) {
      throw new BadRequestException("Parâmetros inválidos");
    }
    console.time("Designation");
    const designation = await designationRepository.findOne(groupId);
    console.timeEnd("Designation");
    if (random) {
      const previousDesignation = await designationRepository.findOneOld(groupId).catch(() => null);
      designation.generateAssignment();
      if (previousDesignation) {
        let retryCount = 0;
        while (isSameAsPreviousDesignation(designation, previousDesignation) && retryCount < 20) {
          console.log(`A designação gerada é igual à anterior, tentando novamente ${retryCount}`);
          designation.generateAssignment();
          retryCount++;
        }
      }
      await sendUpdateDesignation.execute(designation);
    }

    if (filter) {
      designation.filterAssignment(filter);
    }

    return responseHandler.success(designation.toJson());
  } catch (error) {
    return responseHandler.error(error);
  }
};

function compareGroups(firstGroup: string[][], secondGroup: string[][], limit = 0) {
  let matchCount = 0;
  firstGroup.forEach((firstSubGroup) => {
    if (matchCount > limit) return;
    secondGroup.forEach((secondSubGroup) => {
      if (matchCount > limit) return;
      const hasAtLeastTwoCommonMembers = firstSubGroup.filter((member) => secondSubGroup.includes(member)).length >= 2;
      if (hasAtLeastTwoCommonMembers) {
        console.log('Group 1:', firstSubGroup);
        console.log('Group 2:', secondSubGroup);
        console.log('-----------------');
        matchCount++;
      }
    });
  });
  return matchCount > limit;
}

function isSameAsPreviousDesignation(newDesignation: Designation, oldDesignation: Designation) {
  const newSimpleAssignments: string[][] = [];
  const oldSimpleAssignments: string[][] = [];
  let maleCount = 0;

  newDesignation.assignments.forEach(assignment => {
    const participants = assignment.participants.map(participant => participant);
    const maleParticipantsCount = participants.filter(participant => participant.sex === "MALE").length;
    maleCount += maleParticipantsCount;
    const participantNames = participants.map(participant => participant.name);
    newSimpleAssignments.push(participantNames);
  });

  oldDesignation.assignments.forEach(assignment => {
    const participantNames = assignment.participants.map(participant => participant.name);
    oldSimpleAssignments.push(participantNames);
  });

  console.log(`Aceita ${maleCount > 2 ? 0 : 1} duplicações, porque tem ${maleCount} homens`);
  return compareGroups(newSimpleAssignments, oldSimpleAssignments, maleCount > 2 ? 0 : 1);
}