import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { prisma } from "../../../src/infra/prismaClient";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const code = event.pathParameters?.code;
    console.log(`[REDIRECT] Recebida solicitação de redirecionamento para o código: ${code}`);

    if (!code) {
        console.log("[REDIRECT] Erro: Código não fornecido na URL.");
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
            console.log(`[REDIRECT] Link não encontrado para o código: ${code}`);
            return {
                statusCode: 404,
                body: "Link encurtado não encontrado ou expirado.",
            };
        }

        console.log(`[REDIRECT] Sucesso: Redirecionando ${code} para ${shortLink.originalUrl}`);
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
