import { WhatsAppAdapterSendMessage, WhatsAppAdapter } from "../interface/WhatsAppAdapter";

export class WhatsAppService {
  constructor(readonly whatsAppAdapter: WhatsAppAdapter) {}

  async sendMessage({ to, message }: WhatsAppAdapterSendMessage) {
    await this.whatsAppAdapter.sendMessage({ to, message });
  }
}
