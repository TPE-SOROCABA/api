import { IConnectionObserver } from "./IConnectionObserver";

export class WebhookNotificationObserver implements IConnectionObserver {
    private readonly WEBHOOK_URL = "https://auto.wfelipe.com.br/webhook/status";

    async onConnected(): Promise<void> {
        await this.sendNotification("Circuito Fechado: Z-API Conectada. O sistema retomou o processamento.");
    }

    async onDisconnected(): Promise<void> {
        await this.sendNotification("Circuito Aberto: Z-API Desconectada. Mensagens em modo Snooze.");
    }

    private async sendNotification(statusMessage: string): Promise<void> {
        try {
            console.log(`[WebhookNotificationObserver] Sending status to webhook: ${statusMessage}`);

            await fetch(this.WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: statusMessage
                })
            });

            console.log("[WebhookNotificationObserver] Notification sent successfully.");
        } catch (error) {
            console.error("[WebhookNotificationObserver] Failed to send notification:", error);
            // We don't throw here to avoid disrupting the main flow
        }
    }
}
