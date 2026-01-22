import { ShortLinkService } from "../../services/ShortLinkService";
import { prisma } from "../../infra/prismaClient";

export const handler = async () => {
    console.log("[CRON] Iniciando limpeza de links encurtados antigos...");
    const shortLinkService = new ShortLinkService();

    try {
        const count = await shortLinkService.cleanupOldLinks();
        console.log(`[CRON] Limpeza concluída: ${count} links removidos.`);
    } catch (error) {
        console.error("[CRON] Erro ao limpar links encurtados:", error);
    } finally {
        await prisma.$disconnect();
    }
};
