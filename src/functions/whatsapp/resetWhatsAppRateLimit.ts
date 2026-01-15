import { WhatsAppRateLimiterService } from "../../services/WhatsAppRateLimiterService";

const rateLimiter = new WhatsAppRateLimiterService();

export const handler = async () => {
    try {
        console.log("[CRON] Iniciando reset do limitador de taxa do WhatsApp...");
        await rateLimiter.resetLimit();
        console.log("[CRON] Reset concluído com sucesso.");
    } catch (error) {
        console.error("[CRON] Erro ao resetar limitador de taxa:", error);
        throw error;
    }
};
