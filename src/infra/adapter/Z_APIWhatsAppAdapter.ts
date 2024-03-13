import axios from "axios";
import { WhatsAppAdapter, WhatsAppAdapterSendMessage } from "../../interface/WhatsAppAdapter";

const { Z_API_URL, INSTANCE_ID, INSTANCE_TOKEN, USER_TOKEN_ID } = process.env;

type Z_ApiInput = {
  phone: string;
  message: string;
  title?: string;
  image?: string;
  linkUrl?: string;
  linkDescription?: string;
};

export class Z_APIWhatsAppAdapter implements WhatsAppAdapter {
  async sendMessage({ to, message }: WhatsAppAdapterSendMessage) {
    const data: Z_ApiInput = {
      message: message,
      phone: "55" + to,
    };

    const options = {
      method: "POST",
      url: `${Z_API_URL}/${INSTANCE_ID}/token/${INSTANCE_TOKEN}/send-text`,
      headers: {
        "Content-Type": "application/json",
        "client-token": USER_TOKEN_ID,
      },
      data: data,
    };

    console.log(options)

    try {
      const response = await axios.request(options);
      console.log(`Sending ${message} to ${to} using Z_API, response: ${JSON.stringify(response?.data, null, 2)}`);
    } catch (error) {
      console.error(`Error sending message to ${to} using Z_API: ${JSON.stringify(error)}`);
      throw new Error("Internal server error")
    }
  }
}
