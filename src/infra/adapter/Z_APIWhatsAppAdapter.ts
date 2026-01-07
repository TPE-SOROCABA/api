import axios from "axios";
import { WhatsAppAdapter, WhatsAppAdapterSendMessage, WhatsAppAdapterSendButtonMessage, ButtonAction } from "../../interface/WhatsAppAdapter";

const { Z_API_URL, INSTANCE_ID, INSTANCE_TOKEN, USER_TOKEN_ID } = process.env;

type Z_ApiInput = {
  phone: string;
  message: string;
  title: string;
  image?: string;
  linkUrl?: string;
  linkDescription?: string;
  delayMessage?: number;
};

export class Z_APIWhatsAppAdapter implements WhatsAppAdapter {
  async sendMessage({ phone, message, linkUrl, title, linkDescription, delayMessage }: WhatsAppAdapterSendMessage) {
    const data: any = {
      message: message,
      phone: "55" + phone,
      linkUrl,
      image: `${process.env.FRONTEND_URL}/assets/logo-Uk93spzV.png`,
      title,
      linkDescription,
      delayMessage: delayMessage || Math.floor(Math.random() * 8) + 3 // Aleatório entre 3 e 10 segundos
    };

    for (const key in data) {
      if (!data[key]) {
        delete data[key];
      }
    }

    const options = {
      method: "POST",
      url: `${Z_API_URL}/${INSTANCE_ID}/token/${INSTANCE_TOKEN}/send-text`,
      headers: {
        "Content-Type": "application/json",
        "client-token": USER_TOKEN_ID,
      },
      data: data,
    };

    try {
      const response = await axios.request(options);
      console.log(`Sending to ${phone} using Z_API, response: ${JSON.stringify(response?.data, null, 2)}`);
    } catch (error: any) {
      console.error(`Error sending message to ${phone} using Z_API:`, error.response?.data || error.message);
      const status = error.response?.status || 500;
      const customError: any = new Error(error.response?.data?.message || "Internal server error");
      customError.status = status;
      throw customError;
    }
  }

  async sendButtonMessage({ phone, message, title, footer, buttonActions, delayMessage }: WhatsAppAdapterSendButtonMessage) {
    const data: any = {
      phone: "55" + phone,
      message: message,
      buttonActions: buttonActions,
      delayMessage: delayMessage || Math.floor(Math.random() * 8) + 3 // Aleatório entre 3 e 10 segundos
    };

    // Adiciona campos opcionais se fornecidos
    if (title) {
      data.title = title;
    }
    if (footer) {
      data.footer = footer;
    }

    const options = {
      method: "POST",
      url: `${Z_API_URL}/${INSTANCE_ID}/token/${INSTANCE_TOKEN}/send-button-actions`,
      headers: {
        "Content-Type": "application/json",
        "client-token": USER_TOKEN_ID,
      },
      data: data,
    };

    try {
      const response = await axios.request(options);
      console.log(`Sending button message to ${phone} using Z_API, response: ${JSON.stringify(response?.data, null, 2)}`);
    } catch (error: any) {
      console.error(`Error sending button message to ${phone} using Z_API:`, error.response?.data || error.message);
      const status = error.response?.status || 500;
      const customError: any = new Error(error.response?.data?.message || "Internal server error");
      customError.status = status;
      throw customError;
    }
  }
}
