import { Designation } from "../../src/domain/Designation";
import { GenderRequirementRule } from "../../src/domain/DesignationRulesValidation/GenderRequirementRule";
import { OccupancyLimitRule } from "../../src/domain/DesignationRulesValidation/OccupancyLimitRule";
import { ParticipantsNotAloneRule } from "../../src/domain/DesignationRulesValidation/ParticipantsNotAloneRule";
import { ParticipantsNotAssignment } from "../../src/domain/DesignationRulesValidation/ParticipantsNotAssignment";

const weekDesignationsMock = require("./weekDesignations.json") as Designation;
jest.mock("../../src/repositories/DesignationRepository");

function setupDesignationMock() {
  const weekDesignationsMockClone = JSON.parse(JSON.stringify(weekDesignationsMock));
  const participantsNotAloneRule = new ParticipantsNotAloneRule();
  const occupancyLimitRule = new OccupancyLimitRule();
  const genderRequirementRule = new GenderRequirementRule();
  const participantsNotAssignment = new ParticipantsNotAssignment();
  const designation = new Designation(
    weekDesignationsMockClone.id,
    weekDesignationsMockClone.group,
    weekDesignationsMockClone.status,
    weekDesignationsMockClone.assignments,
    weekDesignationsMockClone.participants,
    weekDesignationsMockClone.createdAt,
    weekDesignationsMockClone.updatedAt
  );
  designation.addValidationPlugin(participantsNotAloneRule);
  designation.addValidationPlugin(occupancyLimitRule);
  designation.addValidationPlugin(genderRequirementRule);
  designation.addValidationPlugin(participantsNotAssignment);
  return designation;
}

describe("Designação Semana", () => {
  test("Deve gerar uma designação aleatória", async () => {
    const designation = setupDesignationMock();
    expect(designation).not.toBe(designation.generateAssignment());
  });

  test("Deve validar os getters", async () => {
    const designation = setupDesignationMock();
    expect(designation.captainsAndCoordinatorsNumber).toBe(1);
    expect(designation.oneParticipantAssignments).toBe(false);
    expect(designation.participantsCount).toBe(54);
    expect(designation.totalVacancies).toBe(63);
    expect(designation.retryGenerateAssignment).toBe(true);
  });

  test("Deve filtrar as designações", async () => {
    const designation = setupDesignationMock();
    designation.generateAssignment();
    designation.filterAssignment("Giulia");
    const participant = designation.assignmentsFiltered[0].participants.find((participant) => participant.name.includes("Giulia"));
    expect(participant?.name).toContain("Giulia");
  });

  test("Deve atualizar o status do ponto", async () => {
    const designation = setupDesignationMock();
    const pointId = "65f99ec2a74906aa343a5400";
    const status = false;
    designation.updatePointStatus(pointId, status);
    const assignment = designation.assignments.find((assignment) => assignment.point.id === pointId);
    expect(assignment?.point.status).toBe(false);
  });

  test("Deve remover um participante de um ponto", async () => {
    const designation = setupDesignationMock();
    const pointId = "65f99ec2a74906aa343a5400";
    const participantsIds = ["65fe049ce62483e5e1758157"];
    designation.updateParticipants(pointId, participantsIds);
    const assignment = designation.assignments.find((assignment) => assignment.point.id === pointId);
    const participant = assignment?.participants.find((participant) => participant.id === participantsIds[0]);
    expect(participant?.name).toBe("Carroll Ryan");
    expect(assignment?.participants.length).toBe(1);
  });

  test("Deve mover um participante de um ponto para outro", async () => {
    const designation = setupDesignationMock();
    designation.generateAssignment();
    const pointId = "65f99ec2a74906aa343a5400";
    const participantsIds = ["65fe049ce62483e5e1758157", "65fe049ae62483e5e175813b"];
    designation.updateParticipants(pointId, participantsIds);
    const assignment = designation.assignments.find((assignment) => assignment.point.id === pointId);
    const participant = assignment?.participants.find((participant) => participant.id === participantsIds[0]);
    expect(participant?.name).toBe("Carroll Ryan");
  });

  test("Deve retornar a próxima data de expiração designação", async () => {
    const designation = setupDesignationMock();
    const nextDate = designation.getNextDate(new Date("2024-01-01")); // 2024-01-01 é uma segunda-feira
    expect(nextDate.getTime()).toBe(new Date("2024-01-03 13:0:00.000").getTime()); // 2024-01-03 é uma quarta-feira
    const nextDate2 = designation.getNextDate(new Date("2024-01-03 10:00:00.000")); // 2024-01-03 é uma quarta-feira
    expect(nextDate2.getTime()).toBe(new Date("2024-01-03 13:00:00.000").getTime()); // 2024-01-03 é uma quarta-feira
  });

  test("Deve retornar a próxima data de expiração designação dá proxima semana", async () => {
    const designation = setupDesignationMock();
    const nextDate = designation.getNextDate(new Date("2024-01-03 13:01:00.000")); // 2024-01-03 é uma quarta-feira
    expect(nextDate.getTime()).toBe(new Date("2024-01-10 13:00:00.000").getTime()); // 2024-01-10 é a próxima quarta-feira
  });
});
