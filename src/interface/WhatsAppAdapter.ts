export type WhatsAppAdapterSendMessage = {
    to: string;
    message: string;
    link?: string;
}

export interface WhatsAppAdapter {
    sendMessage: (data: WhatsAppAdapterSendMessage) => Promise<void>;
}
