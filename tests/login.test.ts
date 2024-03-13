import axios from "axios";

describe("Testes de login", () => {
  test("Deve receber status 401 ao tentar logar com senha incorreta", async () => {
    const loginParams = {
      cpf: "12345678900",
      password: "teste",
    };

    try {
      await axios.post(process.env.API_URL + "/login", loginParams);
    } catch (error: any) {
      expect(error.response.status).toBe(401);
    }
  });

  test("Deve receber status 200 ao logar com sucesso", async () => {
    const loginParams = {
      cpf: "123456789",
      password: "homem-aranha",
    };

    const response = await axios.post(process.env.API_URL + "/login", loginParams);
    expect(response.status).toBe(200);
  });

  test("Deve receber status 500 ao passar parâmetros inválidos", async () => {
    const loginParams = null

    try {
        await axios.post(process.env.API_URL + "/login", loginParams);
      } catch (error: any) {
        expect(error.response.status).toBe(500);
        expect(error.response.data.message).toBe("Internal Server Error");
      }
  });
});
