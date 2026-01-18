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
    private readonly CHARS_PER_SECOND = 8.0; // Velocidade humana rápida (aprox. 100 WPM)
    private lastScheduledAt: number;

    constructor() {
        this.sqs = new SQS(
            checkOffline({
                endpoint: "http://0.0.0.0:9324"
            })
        );
        this.lastScheduledAt = Math.floor(Date.now() / 1000);
    }

    async dispatch(payload: QueueMessagePayload) {
        const now = Math.floor(Date.now() / 1000);

        if (!payload.scheduledAt) {
            const typingDuration = this.calculateTypingDuration(payload.message);
            // Garante que o agendamento seja incremental baseada no último agendado ou no agora
            this.lastScheduledAt = Math.max(this.lastScheduledAt, now) + typingDuration;
            payload.scheduledAt = this.lastScheduledAt;
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
        console.log(`[SQS-DISPATCHER] Processando lote de ${messages.length} mensagens para distribuição humana.`);

        for (const message of messages) {
            await this.dispatch(message as QueueMessagePayload);
        }
    }

    /**
     * Calcula o tempo que um humano levaria para digitar a mensagem em segundos
     */
    public calculateTypingDuration(text: string): number {
        const baseDelay = text.length / this.CHARS_PER_SECOND;
        const variation = baseDelay * 0.5; // 50% de variação para mais ou para menos
        const randomFactor = (Math.random() * variation * 2) - variation;

        const calculatedDelay = Math.round(baseDelay + randomFactor);
        return Math.max(15, calculatedDelay);
    }

    async receiveMessagesFromDLQ(maxMessages: number = 10) {
        const response = await this.sqs
            .receiveMessage({
                QueueUrl: process.env.WHATSAPP_MESSAGE_DLQ!,
                MaxNumberOfMessages: Math.min(maxMessages, 10), // SQS limit is 10
                WaitTimeSeconds: 2,
            })
            .promise();

        return response.Messages || [];
    }

    async deleteMessageFromDLQ(receiptHandle: string) {
        await this.sqs
            .deleteMessage({
                QueueUrl: process.env.WHATSAPP_MESSAGE_DLQ!,
                ReceiptHandle: receiptHandle,
            })
            .promise();
    }
}
