import { prisma } from "../infra/prismaClient";
import { IConnectionObserver } from "../shared/observers/IConnectionObserver";
import { LoggingConnectionObserver } from "../shared/observers/LoggingConnectionObserver";
import { WebhookNotificationObserver } from "../shared/observers/WebhookNotificationObserver";

export const ZAPI_CONNECTION_STATUS_KEY = "ZAPI_CONNECTION_STATUS";
export const STATUS_CONNECTED = "CONNECTED";
export const STATUS_DISCONNECTED = "DISCONNECTED";

export class ZApiStatusService {
    private observers: IConnectionObserver[] = [];

    constructor() {
        this.addObserver(new LoggingConnectionObserver());
        this.addObserver(new WebhookNotificationObserver());
    }

    addObserver(observer: IConnectionObserver) {
        this.observers.push(observer);
    }

    async getStatus(): Promise<string> {
        const setting = await prisma.systemSettings.findUnique({
            where: { key: ZAPI_CONNECTION_STATUS_KEY }
        });
        // Default to CONNECTED if not set, to avoid blocking on fresh install
        return setting?.value || STATUS_CONNECTED;
    }

    async setConnected(): Promise<void> {
        console.log("[ZApiStatusService] Setting status to CONNECTED");
        await this.upsertStatus(STATUS_CONNECTED);
        await this.notifyConnected();
    }

    async setDisconnected(): Promise<void> {
        console.log("[ZApiStatusService] Setting status to DISCONNECTED");
        await this.upsertStatus(STATUS_DISCONNECTED);
        await this.notifyDisconnected();
    }

    private async upsertStatus(status: string) {
        await prisma.systemSettings.upsert({
            where: { key: ZAPI_CONNECTION_STATUS_KEY },
            update: { value: status },
            create: { key: ZAPI_CONNECTION_STATUS_KEY, value: status }
        });
    }

    private async notifyConnected() {
        await Promise.allSettled(this.observers.map(obs => obs.onConnected()));
    }

    private async notifyDisconnected() {
        await Promise.allSettled(this.observers.map(obs => obs.onDisconnected()));
    }
}
