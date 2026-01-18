import { Context } from "aws-lambda";
import { SQSMessageDispatcher, QueueMessagePayload } from "../../services/SQSMessageDispatcher";
import { ZApiStatusService, STATUS_CONNECTED } from "../../services/ZApiStatusService";
import { WhatsAppRateLimiterService } from "../../services/WhatsAppRateLimiterService";

const sqsDispatcher = new SQSMessageDispatcher();
const zApiStatusService = new ZApiStatusService();
const rateLimiter = new WhatsAppRateLimiterService();

export const handler = async (event: any, context: Context) => {
    console.log("[DLQ-REDRIVE] Iniciando processamento de recuperação da DLQ...");

    // 1. Verificar Saúde do Circuito
    const status = await zApiStatusService.getStatus();
    const isRateLimited = await rateLimiter.isLimitReached();

    if (status !== STATUS_CONNECTED || isRateLimited) {
        const reason = isRateLimited ? "Rate Limit Atingido" : `Z-API Status: ${status}`;
        console.warn(`[DLQ-REDRIVE] Circuito ABERTO (${reason}). Abortando recuperação.`);
        return;
    }

    console.log("[DLQ-REDRIVE] Circuito saudável. Buscando mensagens na DLQ...");

    // 2. Processar Mensagens com Backpressure
    let messagesProcessed = 0;
    const MAX_MESSAGES = 40;

    // Iremos processar em batches de 10 (limite do SQS) até atingir 40
    while (messagesProcessed < MAX_MESSAGES) {
        const sqsMessages = await sqsDispatcher.receiveMessagesFromDLQ(10);

        if (sqsMessages.length === 0) {
            console.log("[DLQ-REDRIVE] DLQ vazia ou sem mensagens disponíveis.");
            break;
        }

        console.log(`[DLQ-REDRIVE] Recuperadas ${sqsMessages.length} mensagens da DLQ.`);

        for (const msg of sqsMessages) {
            if (!msg.Body || !msg.ReceiptHandle) continue;

            try {
                const payload: QueueMessagePayload = JSON.parse(msg.Body);

                // Limpa o agendamento antigo para que o Dispatcher calcule a nova sequência humana
                delete payload.scheduledAt;

                console.log(`[DLQ-REDRIVE] Re-enfileirando mensagem para ${payload.phone}...`);

                // Devolver para a fila principal (o dispatcher calculará o delay incremental internamente)
                await sqsDispatcher.dispatch(payload);

                // Apagar da DLQ após sucesso
                await sqsDispatcher.deleteMessageFromDLQ(msg.ReceiptHandle);

                messagesProcessed++;
            } catch (error) {
                console.error("[DLQ-REDRIVE] Erro ao processar mensagem da DLQ:", error);
            }

            if (messagesProcessed >= MAX_MESSAGES) break;
        }
    }

    console.log(`[DLQ-REDRIVE] Processamento finalizado. Mensagens recuperadas: ${messagesProcessed}`);
};
