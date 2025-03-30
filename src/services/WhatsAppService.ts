import { WhatsAppAdapterSendMessage, WhatsAppAdapter } from "../interface/WhatsAppAdapter";

export class WhatsAppService {
  constructor(readonly whatsAppAdapter: WhatsAppAdapter) { }

  async sendMessage(data: WhatsAppAdapterSendMessage) {
    if (data.phone.includes("***")) {
      console.log(`Simulating WhatsApp message sending in dev mode`);
      console.log(data);
      await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 300)));
      return;
    }
    await this.whatsAppAdapter.sendMessage(data);
  }
}
