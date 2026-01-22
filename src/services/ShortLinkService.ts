import { prisma } from "../infra/prismaClient";
import { randomBytes } from "crypto";

export class ShortLinkService {
    /**
     * Gera um código único de 4 caracteres
     */
    private generateId(): string {
        return randomBytes(3).toString("hex").substring(0, 4);
    }

    /**
     * Encurta uma URL e retorna a URL curta
     */
    async shorten(originalUrl: string): Promise<string> {
        const apiUrl = process.env.API_URL || 'https://api.tpedigital.com.br/dev';
        let code = this.generateId();

        // Tenta encontrar um código único se houver colisão
        while (await prisma.shortLink.findUnique({ where: { code } })) {
            code = this.generateId();
        }

        await prisma.shortLink.create({
            data: {
                code,
                originalUrl,
            },
        });

        return `${apiUrl}/s/${code}`;
    }

    /**
     * Limpa links criados há mais de 10 dias
     */
    async cleanupOldLinks(): Promise<number> {
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        const result = await prisma.shortLink.deleteMany({
            where: {
                createdAt: {
                    lt: tenDaysAgo,
                },
            },
        });

        console.log(`[CLEANUP] Removidos ${result.count} links encurtados antigos.`);
        return result.count;
    }
}
