import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { prisma } from "../../../src/infra/prismaClient";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const code = event.pathParameters?.code;

    if (!code) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Código não fornecido" }),
        };
    }

    try {
        const shortLink = await prisma.shortLink.findUnique({
            where: { code },
        });

        if (!shortLink) {
            return {
                statusCode: 404,
                body: "Link encurtado não encontrado ou expirado.",
            };
        }

        return {
            statusCode: 302,
            headers: {
                Location: shortLink.originalUrl,
            },
            body: "",
        };
    } catch (error) {
        console.error("[REDIRECT] Erro ao redirecionar:", error);
        return {
            statusCode: 500,
            body: "Erro interno ao processar redirecionamento.",
        };
    } finally {
        await prisma.$disconnect();
    }
};
