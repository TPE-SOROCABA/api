import { WhatsAppAdapterSendMessage, WhatsAppAdapter } from "../interface/WhatsAppAdapter";

export class WhatsAppService {
  constructor(readonly whatsAppAdapter: WhatsAppAdapter) {}

  async sendMessage({ to, message, link }: WhatsAppAdapterSendMessage) {
    await this.whatsAppAdapter.sendMessage({ to, message, link });
  }
}
