import { GroupTimeCalculate } from "../../src/domain/GroupTimeCalculate";
import dayjs from "dayjs";

describe("Mudança de status da designação", () => {
  describe("Início da designação", () => {
    test("Deve validar se a designação deve ser iniciada [+10 minutos]", () => {
      const dataAtual = dayjs("2024-04-21T08:40:00").toDate();
      const group = {
        id: "75bad0aa-291c-4395-a185-83391b733a25",
        name: "Domingo Manhã",
        config_max: 60,
        config_min: 10,
        config_start_hour: "08:30",
        config_end_hour: "13:00",
        config_weekday: "SUNDAY",
      };
      const calculate = new GroupTimeCalculate(group as any, dataAtual);

      expect(calculate.isDesignationStart).toBe(true);
      expect(calculate.isDesignationEnd).toBe(false);
    });

    test("Deve validar se a designação não deve ser iniciada[-10 minutos]", () => {
      const dataAtual = dayjs("2024-04-21T08:20:00").toDate();
      const group = {
        id: "75bad0aa-291c-4395-a185-83391b733a25",
        name: "Segunda Manhã",
        config_max: 60,
        config_min: 10,
        config_start_hour: "08:30",
        config_end_hour: "13:00",
        config_weekday: "SUNDAY",
      };

      const calculate = new GroupTimeCalculate(group as any, dataAtual);

      expect(calculate.isDesignationStart).toBe(false);
      expect(calculate.isDesignationEnd).toBe(false);
    });
  });

  describe("Fim da designação", () => {
    test("Deve validar se a designação deve ser finalizada [+10 minutos]", () => {
      const dataAtual = dayjs("2024-04-21T13:10:00").toDate();
      const group = {
        id: "75bad0aa-291c-4395-a185-83391b733a25",
        name: "Segunda Manhã",
        config_max: 60,
        config_min: 10,
        config_start_hour: "08:30",
        config_end_hour: "13:00",
        config_weekday: "SUNDAY",
      };
      const calculate = new GroupTimeCalculate(group as any, dataAtual);

      expect(calculate.isDesignationStart).toBe(false);
      expect(calculate.isDesignationEnd).toBe(true);
    });

    test("Deve validar se a designação não deve ser finalizada [-10 minutos]", () => {
      const dataAtual = dayjs("2024-04-21T12:50:00").toDate();
      const group = {
        id: "75bad0aa-291c-4395-a185-83391b733a25",
        name: "Segunda Manhã",
        config_max: 60,
        config_min: 10,
        config_start_hour: "08:30",
        config_end_hour: "13:00",
        config_weekday: "SUNDAY",
      };
      const calculate = new GroupTimeCalculate(group as any, dataAtual);

      expect(calculate.isDesignationStart).toBe(true);
      expect(calculate.isDesignationEnd).toBe(false);
    });
  });

  describe("Falta 2 horas para a designação começar", () => {
    test("Deve validar se falta 2 horas para a designação começar [+10 minutos]", () => {
      const dataAtual = dayjs("2024-04-21T06:40:00").toDate();
      const group = {
        id: "75bad0aa-291c-4395-a185-83391b733a25",
        name: "Segunda Manhã",
        config_max: 60,
        config_min: 10,
        config_start_hour: "08:30",
        config_end_hour: "13:00",
        config_weekday: "SUNDAY",
      };
      const calculate = new GroupTimeCalculate(group as any, dataAtual);

      expect(calculate.isDesignationStartLess2Hours).toBe(true);
    });

    test("Deve validar se falta 2 horas para a designação começar [-10 minutos]", () => {
      const dataAtual = dayjs("2024-04-21T06:10:00").toDate();
      const group = {
        id: "75bad0aa-291c-4395-a185-83391b733a25",
        name: "Segunda Manhã",
        config_max: 60,
        config_min: 10,
        config_start_hour: "08:30",
        config_end_hour: "13:00",
        config_weekday: "SUNDAY",
      };
      const calculate = new GroupTimeCalculate(group as any, dataAtual);

      expect(calculate.isDesignationStartLess2Hours).toBe(false);
    });
  });

  describe("Passou 48 horas da designação ser finalizada", () => {
    test("Deve validar se passou 48 horas da designação ser finalizada [+10 minutos]", () => {
      const dataAtual = dayjs("2024-04-23T13:10:00").toDate();
      const group = {
        id: "75bad0aa-291c-4395-a185-83391b733a25",
        name: "Segunda Manhã",
        config_max: 60,
        config_min: 10,
        config_start_hour: "08:30",
        config_end_hour: "13:00",
        config_weekday: "SUNDAY",
      };
      const calculate = new GroupTimeCalculate(group as any, dataAtual);

      expect(calculate.isDesignationEndMore48Hours).toBe(true);
    });

    test("Deve validar se passou 48 horas da designação ser finalizada [-10 minutos]", () => {
      const dataAtual = dayjs("2024-04-23T12:50:00").toDate();
      const group = {
        id: "75bad0aa-291c-4395-a185-83391b733a25",
        name: "Segunda Manhã",
        config_max: 60,
        config_min: 10,
        config_start_hour: "08:30",
        config_end_hour: "13:00",
        config_weekday: "SUNDAY",
      };
      const calculate = new GroupTimeCalculate(group as any, dataAtual);

      expect(calculate.isDesignationEndMore48Hours).toBe(false);
    });
  });
});
