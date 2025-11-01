export type WhatsAppAdapterSendMessage = {
    phone: string;
    message: string;
    title: string;
    linkUrl?: string;
    linkDescription?: string
}

export type ButtonAction = {
    id: string;
    type: 'CALL' | 'URL' | 'REPLY';
    phone?: string; // Para tipo CALL
    url?: string; // Para tipo URL
    label: string;
}

export type WhatsAppAdapterSendButtonMessage = {
    phone: string;
    message: string;
    title?: string;
    footer?: string;
    buttonActions: ButtonAction[];
}

export interface WhatsAppAdapter {
    sendMessage: (data: WhatsAppAdapterSendMessage) => Promise<void>;
    sendButtonMessage: (data: WhatsAppAdapterSendButtonMessage) => Promise<void>;
}
