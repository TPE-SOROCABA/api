import { prisma } from "../infra/prismaClient";

export const WHATSAPP_SENT_COUNT_KEY = "WHATSAPP_SENT_COUNT";
export const WHATSAPP_RATE_LIMIT_STATUS_KEY = "WHATSAPP_RATE_LIMIT_STATUS";
export const WHATSAPP_DAILY_LIMIT_KEY = "WHATSAPP_DAILY_LIMIT";
export const STATUS_OPEN = "OPEN";
export const STATUS_CLOSED = "CLOSED";
const DEFAULT_DAILY_LIMIT = 80;

export class WhatsAppRateLimiterService {
    async getStatus(): Promise<string> {
        const setting = await prisma.systemSettings.findUnique({
            where: { key: WHATSAPP_RATE_LIMIT_STATUS_KEY }
        });
        return setting?.value || STATUS_CLOSED;
    }

    async getSentCount(): Promise<number> {
        const setting = await prisma.systemSettings.findUnique({
            where: { key: WHATSAPP_SENT_COUNT_KEY }
        });
        return setting ? parseInt(setting.value, 10) : 0;
    }

    async getDailyLimit(): Promise<number> {
        const setting = await prisma.systemSettings.findUnique({
            where: { key: WHATSAPP_DAILY_LIMIT_KEY }
        });

        if (!setting) {
            await prisma.systemSettings.create({
                data: { key: WHATSAPP_DAILY_LIMIT_KEY, value: DEFAULT_DAILY_LIMIT.toString() }
            });
            return DEFAULT_DAILY_LIMIT;
        }

        return parseInt(setting.value, 10);
    }

    async incrementSentCount(): Promise<void> {
        const currentCount = await this.getSentCount();
        const limit = await this.getDailyLimit();
        const newCount = currentCount + 1;

        await prisma.systemSettings.upsert({
            where: { key: WHATSAPP_SENT_COUNT_KEY },
            update: { value: newCount.toString() },
            create: { key: WHATSAPP_SENT_COUNT_KEY, value: newCount.toString() }
        });

        if (newCount >= limit) {
            console.warn(`[RATE-LIMITER] Limite de ${limit} atingido. Abrindo circuito.`);
            await this.openCircuit();
        }
    }

    async openCircuit(): Promise<void> {
        await prisma.systemSettings.upsert({
            where: { key: WHATSAPP_RATE_LIMIT_STATUS_KEY },
            update: { value: STATUS_OPEN },
            create: { key: WHATSAPP_RATE_LIMIT_STATUS_KEY, value: STATUS_OPEN }
        });
    }

    async resetLimit(): Promise<void> {
        console.log("[RATE-LIMITER] Resetando contador e fechando circuito.");

        // Randomize limit between 80 and 100
        const newLimit = Math.floor(Math.random() * (100 - 80 + 1)) + 80;
        console.log(`[RATE-LIMITER] Definindo novo limite aleatório: ${newLimit}`);

        await prisma.systemSettings.upsert({
            where: { key: WHATSAPP_DAILY_LIMIT_KEY },
            update: { value: newLimit.toString() },
            create: { key: WHATSAPP_DAILY_LIMIT_KEY, value: newLimit.toString() }
        });

        await prisma.systemSettings.upsert({
            where: { key: WHATSAPP_SENT_COUNT_KEY },
            update: { value: "0" },
            create: { key: WHATSAPP_SENT_COUNT_KEY, value: "0" }
        });

        await prisma.systemSettings.upsert({
            where: { key: WHATSAPP_RATE_LIMIT_STATUS_KEY },
            update: { value: STATUS_CLOSED },
            create: { key: WHATSAPP_RATE_LIMIT_STATUS_KEY, value: STATUS_CLOSED }
        });
    }

    async isLimitReached(): Promise<boolean> {
        const status = await this.getStatus();
        if (status === STATUS_OPEN) return true;

        const count = await this.getSentCount();
        const limit = await this.getDailyLimit();
        if (count >= limit) {
            await this.openCircuit();
            return true;
        }

        return false;
    }
}
