export type WhatsAppAdapterSendMessage = {
    phone: string;
    message: string;
    title: string;
    linkUrl?: string;
    linkDescription?: string;
    delayMessage?: number;
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
    delayMessage?: number;
}

export type WhatsAppAdapterSendButtonOTP = {
    phone: string;
    message: string;
    code: string;
    buttonText?: string;
    delayMessage?: number;
}

export interface WhatsAppAdapter {
    sendMessage: (data: WhatsAppAdapterSendMessage) => Promise<void>;
    sendButtonMessage: (data: WhatsAppAdapterSendButtonMessage) => Promise<void>;
    sendButtonOTP: (data: WhatsAppAdapterSendButtonOTP) => Promise<void>;
}
