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
    greetings: ["Olá", "Oi", "Tudo bem?", "Oi!"],
    closings: [
      "Um abraço!",
      "Até mais.",
      "Contamos com seu apoio.",
      "Equipe TPE.",
    ],
  };

  private templates: Record<MessageType, string[]> = {
    [MessageType.INVITATION]: [
      "[GREETING] [NAME],\n\nVocê recebeu uma nova designação:\n[DETAILS].\n\n[CLOSING]",
      "[GREETING] [NAME]!\n\nPassando para avisar que confirmamos sua escala:\n[DETAILS].\n\n[CLOSING]",
      "[GREETING] [NAME],\n\nFicamos felizes em contar com sua ajuda para:\n[DETAILS].\n\n[CLOSING]",
    ],
    [MessageType.INVITATION_GROUP]: [
      "A designação para *[DETAILS]* já está disponível. Confiram os detalhes nos botões abaixo."
    ],
    [MessageType.CANCELLATION]: [
      "[GREETING] [NAME],\n\nPrecisamos cancelar sua designação desta vez:\n[DETAILS].\n\n[CLOSING]",
      "[GREETING] [NAME],\n\nHouve um imprevisto e sua participação não será mais necessária em:\n[DETAILS].\n\n[CLOSING]",
      "[GREETING] [NAME],\n\nAvisamos que a atividade a seguir foi cancelada:\n[DETAILS].\n\n[CLOSING]",
    ],
    [MessageType.CANCELLATION_GROUP]: [
      "Aviso: A designação do dia *[DETAILS]* foi cancelada. Desconsiderem a escala anterior.",
      "Informamos que não haverá mais a atividade programada para *[DETAILS]*. Designação cancelada.",
      "Atualização: O carrinho/ponto do dia *[DETAILS]* foi cancelado."
    ],
    [MessageType.OTP]: [
      "[GREETING] [NAME],\n\nRecebemos uma solicitação para redefinir sua senha.\nSeu código de verificação é: *[CODE]*.\n\n[CLOSING]",
      "[GREETING] [NAME],\n\nPara criar uma nova senha, utilize o código abaixo:\n*[CODE]*\n\n[CLOSING]",
      "[GREETING] [NAME],\n\nSeu código para recuperação de senha é *[CODE]*.\nEle é válido por 5 minutos.\n\n[CLOSING]",
    ],
    [MessageType.OTP_SIMPLE]: [
      "Olá [NAME], seu código de verificação TPE Digital é:",
    ],
    [MessageType.COORDINATOR_ALERT]: [
      "[GREETING] [NAME],\n\nAlerta: A designação [DETAILS] foi aberta agora e inicia em menos de 2h.\nVerifique se os participantes estão avisados.\n\n[CLOSING]",
      "[GREETING] [NAME]!\n\nAviso de urgência:\n[DETAILS] foi criada recentemente e começa logo.\n\n[CLOSING]",
      "[GREETING] [NAME],\n\nAtenção para designação de última hora:\n[DETAILS].\n\n[CLOSING]",
    ],
    [MessageType.COMPLETED_NOTIFICATION]: [
      "[GREETING] [NAME]!\n\nA designação [DETAILS] foi CONCLUÍDA.\nLembre-se de conferir os detalhes em até 48h.\n\n[CLOSING]",
      "[GREETING] [NAME],\n\nO turno em [DETAILS] terminou.\nSe houve ausências, ajuste na designação em até 48h.\n\n[CLOSING]",
      "[GREETING] [NAME],\n\nFinalizamos a atividade [DETAILS].\nA designação ficará disponível para ajustes por 48h.\n\n[CLOSING]",
    ],
    [MessageType.ARCHIVE_NOTIFICATION]: [
      "[GREETING] [NAME],\n\nA designação de [DETAILS] foi fechada/arquivada.\nNovas designações já podem ser criadas.\n\n[CLOSING]",
      "[GREETING] [NAME]!\n\nAtividade [DETAILS] encerrada no sistema.\nNão é mais possível editar a designação.\n\n[CLOSING]",
      "[GREETING] [NAME],\n\nInformamos que [DETAILS] foi arquivada com sucesso.\n\n[CLOSING]",
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
