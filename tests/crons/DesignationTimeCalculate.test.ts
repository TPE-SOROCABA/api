import { Weekday } from "@prisma/client";
import { DesignationTimeCalculate } from "../../src/domain/DesignationTimeCalculate";
import dayjs from "dayjs";

describe("Mudança de status da designação", () => {
  describe("Início da designação", () => {
    test("Deve validar se a designação deve ser iniciada [+10 minutos]", () => {
      const dataAtual = dayjs("2024-04-21 08:35").toDate();
      const designation = {
        designationDate: "2024-04-21 08:30",
        designationEndDate: "2024-04-21 13:00"
      };
      const calculate = new DesignationTimeCalculate(designation as any, dataAtual);

      expect(calculate.isDesignationStart).toBe(true);
      expect(calculate.isDesignationEnd).toBe(false);
    });

    test("Deve validar se a designação não deve ser iniciada[-10 minutos]", () => {
      const dataAtual = dayjs("2024-04-21T08:20:00").toDate();
      const designation = {
        designationDate: "2024-04-21 08:30",
        designationEndDate: "2024-04-21 13:00"
      };

      const calculate = new DesignationTimeCalculate(designation as any, dataAtual);

      expect(calculate.isDesignationStart).toBe(false);
      expect(calculate.isDesignationEnd).toBe(false);
    });
  });

  describe("Fim da designação", () => {
    test("Deve validar se a designação deve ser finalizada [+10 minutos]", () => {
      const dataAtual = dayjs("2024-04-21T13:10:00").toDate();
      const designation = {
        designationDate: "2024-04-21 08:30",
        designationEndDate: "2024-04-21 13:00"
      };
      const calculate = new DesignationTimeCalculate(designation as any, dataAtual);

      expect(calculate.isDesignationStart).toBe(false);
      expect(calculate.isDesignationEnd).toBe(true);
    });

    test("Deve validar se a designação não deve ser finalizada [-10 minutos]", () => {
      const dataAtual = dayjs("2024-04-21T12:50:00").toDate();
       const designation = {
        designationDate: "2024-04-21 08:30",
        designationEndDate: "2024-04-21 13:00"
      };
      const calculate = new DesignationTimeCalculate(designation as any, dataAtual);

      expect(calculate.isDesignationStart).toBe(true);
      expect(calculate.isDesignationEnd).toBe(false);
    });
  });

  describe("Falta 2 horas para a designação começar", () => {
    test("Deve validar se falta 2 horas para a designação começar [+10 minutos]", () => {
      const dataAtual = dayjs("2024-04-21T06:40:00").toDate();
       const designation = {
        designationDate: "2024-04-21 08:30",
        designationEndDate: "2024-04-21 13:00"
      };
      const calculate = new DesignationTimeCalculate(designation as any, dataAtual);

      expect(calculate.isDesignationStartLess2Hours).toBe(true);
    });

    test("Deve validar se falta 2 horas para a designação começar [-10 minutos]", () => {
      const dataAtual = dayjs("2024-04-21T06:10:00").toDate();
       const designation = {
        designationDate: "2024-04-21 08:30",
        designationEndDate: "2024-04-21 13:00"
      };
      const calculate = new DesignationTimeCalculate(designation as any, dataAtual);

      expect(calculate.isDesignationStartLess2Hours).toBe(false);
    });
  });

  describe("Passou 48 horas da designação ser finalizada", () => {
    test("Deve validar se passou 48 horas da designação ser finalizada [+10 minutos]", () => {
      const dataAtual = dayjs("2024-04-23T13:10:00").toDate();
       const designation = {
        designationDate: "2024-04-21 08:30",
        designationEndDate: "2024-04-21 13:00"
      };
      const calculate = new DesignationTimeCalculate(designation as any, dataAtual);

      expect(calculate.isDesignationEndMore48Hours).toBe(true);
    });

    test("Deve validar se passou 48 horas da designação ser finalizada [-10 minutos]", () => {
      const dataAtual = dayjs("2024-04-23T12:50:00").toDate();
       const designation = {
        designationDate: "2024-04-21 08:30",
        designationEndDate: "2024-04-21 13:00"
      };
      const calculate = new DesignationTimeCalculate(designation as any, dataAtual);

      expect(calculate.isDesignationEndMore48Hours).toBe(false);
    });
  });
});
