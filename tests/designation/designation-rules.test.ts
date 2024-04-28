import { ParticipantsNotAssignment } from './../../src/domain/DesignationRulesValidation/ParticipantsNotAssignment';
import { GenderRequirementRule } from './../../src/domain/DesignationRulesValidation/GenderRequirementRule';
import { OccupancyLimitRule } from './../../src/domain/DesignationRulesValidation/OccupancyLimitRule';
import { ParticipantsNotAloneRule } from "../../src/domain/DesignationRulesValidation/ParticipantsNotAloneRule";
import { Designation } from "../../src/domain/Designation";
import { ParticipantSex } from '../../src/enums/ParticipantSex';

const weekDesignationsMock = require("./weekDesignations.json") as Designation;
jest.mock("../../src/repositories/DesignationRepository");

function setupDesignationMock() {
  const weekDesignationsMockClone = JSON.parse(JSON.stringify(weekDesignationsMock));
  const participantsNotAloneRule = new ParticipantsNotAloneRule();
  const occupancyLimitRule= new OccupancyLimitRule()
  const genderRequirementRule = new GenderRequirementRule()
  const participantsNotAssignment = new ParticipantsNotAssignment()
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
  designation.addValidationPlugin(genderRequirementRule)
  designation.addValidationPlugin(participantsNotAssignment)
  return designation
}

describe("Designação Semana - Rules", () => {
  test("Deve validar se tem participantes sozinhos em um ponto", async () => {
    const designation = setupDesignationMock();
    designation.generateAssignment();
    
    const participant = designation.assignments[0].participants[0];
    designation.assignments[0].participants = [participant];

    expect(() => designation.applyValidations()).toThrow("O ponto não pode ter apenas um participante");
  });

  test("Deve validar se não tem participantes sozinhos em um ponto", async () => {
    const designation = setupDesignationMock();
    designation.generateAssignment();

    expect(() => designation.applyValidations()).not.toThrow();
  });

  test("Deve validar se quantidade de participantes é menor que o limite de ocupação", async () => {
    const designation = setupDesignationMock();
    designation.generateAssignment();

    expect(() => designation.applyValidations()).not.toThrow();
  })

  
  test("Deve validar a regra de genero dentro de uma atribuição - gênero diferente", () => {
    const designation = setupDesignationMock();

    designation.assignments[0].participants.push({
      id: "65fe049ce62483e5e175815b",
      name: "Giulia Felipe",
      phone: "(01) 6972-5473FAKE",
      profile: "PARTICIPANT",
      profile_photo: "",
      sex: ParticipantSex.FEMALE,
      incident_history: null,
    } as any);

    designation.assignments[0].participants.push({
      id: "65fe049ce62483e5e175815b",
      name: "Wilson Felipe",
      phone: "(01) 6972-5473FAKE",
      profile: "PARTICIPANT",
      profile_photo: "",
      sex: ParticipantSex.MALE,
      incident_history: null,
    } as any);

    expect(() => designation.applyValidations()).toThrow("O ponto Bolsas (Adicional) não pode ter 2 participantes de sexos diferentes");
  })

  test("Deve validar a regra de gênero dentro de uma atribuição - mesmo gênero", () => {
    const designation = setupDesignationMock();

    designation.assignments[0].participants.push({
      id: "65fe049ce62483e5e175815b",
      name: "Giulia Felipe",
      phone: "(01) 6972-5473FAKE",
      profile: "PARTICIPANT",
      profile_photo: "",
      sex: ParticipantSex.FEMALE,
      incident_history: null,
    } as any);

    designation.assignments[0].participants.push({
      id: "65fe049ce62483e5e175815b",
      name: "Giulia Felipe",
      phone: "(01) 6972-5473FAKE",
      profile: "PARTICIPANT",
      profile_photo: "",
      sex: ParticipantSex.FEMALE,
      incident_history: null,
    } as any);

    designation.participants = []

    expect(() => designation.applyValidations()).not.toThrow();
  })

  test("Deve validar a regra de genero dentro de uma atribuição - gênero misto", () => {
    const designation = setupDesignationMock();

    designation.assignments[0].participants.push({
      id: "65fe049ce62483e5e175815b",
      name: "Giulia Felipe",
      phone: "(01) 6972-5473FAKE",
      profile: "PARTICIPANT",
      profile_photo: "",
      sex: ParticipantSex.FEMALE,
      incident_history: null,
    } as any);

    designation.assignments[0].participants.push({
      id: "65fe049ce62483e5e175815b",
      name: "Giulia Felipe",
      phone: "(01) 6972-5473FAKE",
      profile: "PARTICIPANT",
      profile_photo: "",
      sex: ParticipantSex.FEMALE,
      incident_history: null,
    } as any);

    designation.assignments[0].participants.push({
      id: "65fe049ce62483e5e175815b",
      name: "Wilson Felipe",
      phone: "(01) 6972-5473FAKE",
      profile: "PARTICIPANT",
      profile_photo: "",
      sex: ParticipantSex.MALE,
      incident_history: null,
    } as any);

    designation.participants = []

    expect(() => designation.applyValidations()).not.toThrow();
  })
});
