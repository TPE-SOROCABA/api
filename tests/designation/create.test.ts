import { WeekDesignationModel } from './../../src/repositories/models/WeekDesignationModel';
import { handler as createDesignations } from "../../src/functions/designations/createDesignations";
import { connectToDatabase } from "../../src/infra/connectToDatabase";
import { DesignationModel } from "../../src/repositories/models/DesignationModel";
import { setupHandler } from "../setup-tests";

jest.setTimeout(60000);
describe("Testes de criação de designação", () => {
  test("Deve criar uma designação com sucesso", async () => {
    await connectToDatabase();
    await DesignationModel.deleteMany({})
    await WeekDesignationModel.deleteMany({})
    const _event: any = {
        queryStringParameters: {
            groupId: "65fe068c81870be5412f90fd"
        }
    };
    const data = await setupHandler(_event, createDesignations)
    expect(data.statusCode).toBe(200);
    expect(data.body).toBe('{"message":"Designação criada com sucesso!"}');

  });
});
