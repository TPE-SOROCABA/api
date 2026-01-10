import { SQSEvent } from "aws-lambda";
import { SQSMessageDispatcher, QueueMessagePayload } from "../../services/SQSMessageDispatcher";
import { WhatsAppService } from "../../services/WhatsAppService";
import { Z_APIWhatsAppAdapter } from "../../infra/adapter/Z_APIWhatsAppAdapter";
import { ZApiStatusService, STATUS_CONNECTED } from "../../services/ZApiStatusService";

const sqsDispatcher = new SQSMessageDispatcher();
const whatsappService = new WhatsAppService(new Z_APIWhatsAppAdapter());
const zApiStatusService = new ZApiStatusService();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const handler = async (event: SQSEvent) => {
    for (const record of event.Records) {
        const payload: QueueMessagePayload = JSON.parse(record.body);
        const now = Math.floor(Date.now() / 1000);

        // 1. Verificação do Circuit Breaker (Z-API Status)
        const status = await zApiStatusService.getStatus();

        if (status !== STATUS_CONNECTED) {
            console.warn(`[CIRCUIT-BREAKER] Circuito ABERTO (Status: ${status}). Mensagem para ${payload.phone} retida.`);
            if (!payload.scheduledAt) {
                // Define um scheduledAt inicial se não existir
                console.log(`[CIRCUIT-BREAKER] Definindo scheduledAt inicial para mensagem de ${payload.phone}.`);
                payload.scheduledAt = now;
            }
            // Lógica de Snooze Cíclico (10 minutos)
            const snoozeMinutes = 10;
            const snoozeSeconds = snoozeMinutes * 60;
            const nextAttempt = payload.scheduledAt + snoozeSeconds;

            // Atualiza o payload para manter rastreabilidade
            payload.scheduledAt = nextAttempt;

            console.log(`[CIRCUIT-BREAKER] Re-enfileirando mensagem para ${nextAttempt} (Delay: ${snoozeSeconds}s).`);

            // Reenvia para o SQS. O Dispatcher calculará o DelaySeconds baseado no scheduledAt
            await sqsDispatcher.dispatch(payload);

            // Processamento encerrado para esta mensagem (ACK implícito ao terminar sem erro)
            continue;
        }

        console.log(`[SQS-WHATSAPP-HANDLER] Iniciando processamento. Destinatário: ${payload.phone}. Agendado: ${payload.scheduledAt}, Agora: ${now}`);

        if (payload.scheduledAt && now < payload.scheduledAt) {
            const remaining = payload.scheduledAt - now;

            if (remaining <= 10) {
                console.log(`[SQS-WHATSAPP-HANDLER] Atraso curto detectado (${remaining}s). Aguardando processamento local...`);
                await sleep(remaining * 1000);
            } else {
                console.log(`[SQS-WHATSAPP-HANDLER] Delay recursivo necessário. Faltam ${remaining}s. Re-enfileirando mensagem para ${payload.phone}...`);
                await sqsDispatcher.dispatch(payload);
                continue;
            }
        }

        // Caso total delay atingido ou sleep finalizado, realizar o envio real
        try {
            console.log(`[SQS-WHATSAPP-HANDLER] Enviando mensagem (Tipo: ${payload.type}) para ${payload.phone}.`);
            if (payload.type === "button") {
                await whatsappService.sendButtonMessage({
                    phone: payload.phone,
                    message: payload.message,
                    title: payload.title,
                    footer: payload.footer,
                    buttonActions: payload.buttonActions || [],
                    delayMessage: 0 // Já aplicamos o delay humano no SQS/Sleep
                });
            } else {
                await whatsappService.sendMessage({
                    phone: payload.phone,
                    message: payload.message,
                    title: payload.title || "TPE Digital",
                    linkUrl: payload.linkUrl,
                    linkDescription: payload.linkDescription,
                    delayMessage: 0
                });
            }
            console.log(`[SQS-WHATSAPP-HANDLER] Sucesso no envio para ${payload.phone}`);
        } catch (error: any) {
            const status = error.status || 500;
            console.error(`[SQS-WHATSAPP-HANDLER] Erro ao enviar para ${payload.phone} (Status: ${status}):`, error.message);

            if (status >= 400 && status < 500) {
                console.log(`[SQS-WHATSAPP-HANDLER] [ERRO-CLIENTE] Erro permanente ${status}. Movendo para DLQ para auditoria manual.`);
                await sqsDispatcher.dispatchToDLQ(payload);
                // Não lançamos erro para evitar que o SQS tente novamente
                continue;
            }

            // Para erros 5xx ou outros, lançamos erro para o SQS realizar retentativa básica
            console.log(`[SQS-WHATSAPP-HANDLER] [ERRO-SERVIDOR] Status ${status}. Propagando erro para retentativa do SQS.`);
            throw error;
        }
    }
};
