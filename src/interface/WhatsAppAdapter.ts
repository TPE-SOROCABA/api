export type WhatsAppAdapterSendMessage = {
    to: string;
    message: string;
}

export interface WhatsAppAdapter {
    sendMessage: (data: WhatsAppAdapterSendMessage) => Promise<void>;
}
