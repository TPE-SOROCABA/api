import { WhatsAppAdapterSendMessage, WhatsAppAdapter, WhatsAppAdapterSendButtonMessage, WhatsAppAdapterSendButtonOTP } from "../interface/WhatsAppAdapter";

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

  async sendButtonMessage(data: WhatsAppAdapterSendButtonMessage) {
    if (data.phone.includes("***")) {
      console.log(`Simulating WhatsApp button message sending in dev mode`);
      console.log(data);
      await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 300)));
      return;
    }
    await this.whatsAppAdapter.sendButtonMessage(data);
  }

  async sendButtonOTP(data: WhatsAppAdapterSendButtonOTP) {
    if (data.phone.includes("***")) {
      console.log(`Simulating WhatsApp OTP sending in dev mode`);
      console.log(data);
      await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 300)));
      return;
    }
    await this.whatsAppAdapter.sendButtonOTP(data);
  }
}
