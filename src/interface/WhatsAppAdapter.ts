export type WhatsAppAdapterSendMessage = {
    phone: string;
    message: string;
    title: string;
    linkUrl?: string;
    linkDescription?: string
}

export interface WhatsAppAdapter {
    sendMessage: (data: WhatsAppAdapterSendMessage) => Promise<void>;
}
