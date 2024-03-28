import axios from "axios";

describe("Testes de login", () => {
  test("Deve receber status 401 ao tentar logar com senha incorreta", async () => {
    const loginParams = {
      cpf: "12345678900",
      password: "teste",
    };

    try {
      await axios.post(process.env.API_URL + "/auth/login", loginParams);
    } catch (error: any) {
      expect(error.response.status).toBe(401);
    }
  });
});
