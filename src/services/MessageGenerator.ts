export enum MessageType {
  INVITATION = "INVITATION",
  INVITATION_GROUP = "INVITATION_GROUP",
  CANCELLATION = "CANCELLATION",
  CANCELLATION_GROUP = "CANCELLATION_GROUP",
  OTP = "OTP",
  OTP_SIMPLE = "OTP_SIMPLE",
  COORDINATOR_ALERT = "COORDINATOR_ALERT",
  COMPLETED_NOTIFICATION = "COMPLETED_NOTIFICATION",
  ARCHIVE_NOTIFICATION = "ARCHIVE_NOTIFICATION",
}

export interface MessageData {
  recipientName: string;
  details?: string;
  code?: string;
  loginLink?: string;
}

export class MessageGenerator {
  private variations = {
    greetings: ["Olá", "Oi", "Oi!", "Olá!"],
    closings: ["Equipe TPE Digital", "Atenciosamente, TPE Digital", "Obrigado, TPE Digital"],
  };

  private templates: Record<MessageType, string[]> = {
    [MessageType.INVITATION]: [
      "📢 TPE Digital | Nova Designação\n\n[GREETING], [NAME]! 😊\n\nVocê recebeu uma nova designação:\n*[DETAILS]*\n\n👉 Para consultar os detalhes e confirmar sua presença, acesse o TPE Digital.\n\nEm caso de dúvidas técnicas ou necessidade de atualização de dados, entre em contato com o SAC TPE Digital.\n\n[CLOSING]"
    ],
    [MessageType.INVITATION_GROUP]: [
      "📢 TPE Digital | Designação disponível\n\n[GREETING]! 😊\n\nA designação de [DETAILS] já está disponível no TPE Digital.\n\n👉 Para consultar os detalhes, utilize um dos botões abaixo:\n• Designação Geral – visão completa\n• Minha Designação – sua designação individual\n\nEm caso de dúvidas técnicas ou necessidade de atualização de dados, entre em contato com o SAC TPE Digital.\n\n[CLOSING]"
    ],
    [MessageType.CANCELLATION]: [
      "📢 TPE Digital | Designação Cancelada\n\n[GREETING], [NAME]!\n\nInformamos que sua designação para *[DETAILS]* foi cancelada.\n\nSentimos pelo imprevisto e contamos com sua ajuda em uma próxima oportunidade.\n\nEm caso de dúvidas técnicas ou necessidade de atualização de dados, entre em contato com o SAC TPE Digital.\n\n[CLOSING]"
    ],
    [MessageType.CANCELLATION_GROUP]: [
      "📢 TPE Digital | Aviso de Cancelamento\n\n[GREETING]! 😊\n\nInformamos que a designação para *[DETAILS]* foi cancelada. Favor desconsiderar a escala anterior.\n\nEm caso de dúvidas técnicas ou necessidade de atualização de dados, entre em contato com o SAC TPE Digital.\n\n[CLOSING]"
    ],
    [MessageType.OTP]: [
      "📢 TPE Digital | Código de Verificação\n\n[GREETING], [NAME]! 😊\n\nRecebemos uma solicitação para acessar sua conta ou redefinir sua senha.\n\n👉 Seu código de verificação é: *[CODE]*\n\nEste código é válido por 5 minutos. Se você não solicitou este código, por favor, desconsidere esta mensagem.\n\n[CLOSING]"
    ],
    [MessageType.OTP_SIMPLE]: [
      "📢 TPE Digital | Código de Verificação\n\n[GREETING], [NAME]! 😊\n\nSeu código de verificação é: *[CODE]*\n\n[CLOSING]"
    ],
    [MessageType.COORDINATOR_ALERT]: [
      "📢 TPE Digital | Alerta de Designação Próxima\n\n[GREETING], [NAME]! ⚠️\n\nAtenção: A designação *[DETAILS]* inicia em menos de 2 horas.\n\nPor favor, verifique se todos os participantes já estão cientes e confirmados.\n\n👉 Acesse o painel do coordenador para acompanhar.\n\n[CLOSING]"
    ],
    [MessageType.COMPLETED_NOTIFICATION]: [
      "📢 TPE Digital | Designação Concluída\n\n[GREETING], [NAME]! 😊\n\nA designação *[DETAILS]* foi finalizada com sucesso.\n\n👉 Lembre-se de realizar os ajustes necessários e conferir os detalhes no sistema em até 48 horas.\n\n[CLOSING]"
    ],
    [MessageType.ARCHIVE_NOTIFICATION]: [
      "📢 TPE Digital | Designação Arquivada\n\n[GREETING], [NAME]!\n\nA designação *[DETAILS]* foi arquivada e encerrada no sistema.\n\nA partir de agora, não é mais possível realizar edições nesta designação.\n\n[CLOSING]"
    ],
  };

  generate(type: MessageType, data: MessageData): string {
    const template = this.getRandom(this.templates[type]);
    const greeting = this.getRandom(this.variations.greetings);
    const closing = this.getRandom(this.variations.closings);

    let message = template
      .replace("[GREETING]", greeting)
      .replace("[NAME]", data.recipientName)
      .replace("[CLOSING]", closing);

    if (data.details) {
      message = message.replace("[DETAILS]", data.details);
    }

    if (data.code) {
      message = message.replace("[CODE]", data.code);
    }

    if (data.loginLink) {
      message = message.replace("[LOGIN_LINK]", data.loginLink);
    }

    return message;
  }

  private getRandom(array: any[]): any {
    return array[Math.floor(Math.random() * array.length)];
  }
}
