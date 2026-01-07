import { APIGatewayProxyEvent } from "aws-lambda";
import { SQSMessageDispatcher } from "../../services/SQSMessageDispatcher";

const sqsDispatcher = new SQSMessageDispatcher();

export const handler = async (event: APIGatewayProxyEvent) => {
    try {
        const body = JSON.parse(event.body || "{}");
        const { phone, message } = body;

        if (!phone || !message) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Telefone e mensagem são obrigatórios" }),
            };
        }

        await sqsDispatcher.dispatch({
            phone,
            message,
            type: "text"
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Mensagem enviada para a fila SQS" }),
        };
    } catch (error) {
        console.error("Erro no teste de SQS:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Erro interno ao processar requisição" }),
        };
    }
};
