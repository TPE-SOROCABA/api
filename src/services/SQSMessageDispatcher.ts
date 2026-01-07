import { SQS } from "aws-sdk";
import { v4 as uuid } from "uuid";

const checkOffline = (config: Object) => (process.env.NODE_ENV === "local" ? config : {});

export type QueueMessagePayload = {
    phone: string;
    message: string;
    title?: string;
    footer?: string;
    linkUrl?: string;
    linkDescription?: string;
    type: "text" | "button";
    buttonActions?: any[];
    scheduledAt?: number; // Unix timestamp
};

export class SQSMessageDispatcher {
    private sqs: SQS;
    private readonly CHARS_PER_SECOND = 3.3; // Média humana de digitação

    constructor() {
        this.sqs = new SQS(
            checkOffline({
                endpoint: "http://0.0.0.0:9324"
            })
        );
    }

    async dispatch(payload: QueueMessagePayload) {
        const now = Math.floor(Date.now() / 1000);

        if (!payload.scheduledAt) {
            payload.scheduledAt = now + this.calculateTypingDuration(payload.message);
        }

        const initialDelay = payload.scheduledAt - now;
        const delaySeconds = Math.max(0, Math.min(900, initialDelay));

        console.log(`[SQS-DISPATCHER] Enfileirando mensagem para ${payload.phone}. Alvo: ${new Date(payload.scheduledAt * 1000).toLocaleString()}, Delay SQS: ${delaySeconds}s.`);

        await this.sqs
            .sendMessage({
                MessageBody: JSON.stringify(payload),
                QueueUrl: process.env.WHATSAPP_MESSAGE_QUEUE!,
                DelaySeconds: delaySeconds,
            })
            .promise();
    }

    async dispatchToDLQ(payload: QueueMessagePayload) {
        console.log(`[SQS-DISPATCHER] [DLQ] Movendo mensagem para ${payload.phone} para a fila de erros devido a falha permanente.`);

        await this.sqs
            .sendMessage({
                MessageBody: JSON.stringify(payload),
                QueueUrl: process.env.WHATSAPP_MESSAGE_DLQ!,
                // Sem delay para mensagens com erro
            })
            .promise();
    }

    async dispatchBatch(messages: Omit<QueueMessagePayload, 'scheduledAt'>[]) {
        let lastScheduledAt = Math.floor(Date.now() / 1000);

        console.log(`[SQS-DISPATCHER] Processando lote de ${messages.length} mensagens para distribuição humana.`);

        for (const message of messages) {
            const typingDuration = this.calculateTypingDuration(message.message);
            lastScheduledAt += typingDuration;

            await this.dispatch({
                ...message,
                scheduledAt: lastScheduledAt
            });
        }
    }

    /**
     * Calcula o tempo que um humano levaria para digitar a mensagem em segundos
     */
    private calculateTypingDuration(text: string): number {
        const baseDelay = text.length / this.CHARS_PER_SECOND;
        const variation = baseDelay * 0.2;
        const randomFactor = (Math.random() * variation * 2) - variation;

        return Math.round(baseDelay + randomFactor);
    }
}
