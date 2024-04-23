import { WhatsAppAdapterSendMessage, WhatsAppAdapter } from "../interface/WhatsAppAdapter";

export class WhatsAppService {
  constructor(readonly whatsAppAdapter: WhatsAppAdapter) {}

  async sendMessage(data: WhatsAppAdapterSendMessage) {
    await this.whatsAppAdapter.sendMessage(data);
  }
}
