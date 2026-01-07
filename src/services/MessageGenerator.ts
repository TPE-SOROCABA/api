export enum MessageType {
  INVITATION = "INVITATION",
  CANCELLATION = "CANCELLATION",
  OTP = "OTP",
  IN_PROGRESS_REMINDER = "IN_PROGRESS_REMINDER",
  CRITICAL_REMINDER = "CRITICAL_REMINDER",
  POST_EVENT_FOLLOW_UP = "POST_EVENT_FOLLOW_UP",
  COORDINATOR_ALERT = "COORDINATOR_ALERT",
  COMPLETED_NOTIFICATION = "COMPLETED_NOTIFICATION",
  ARCHIVE_NOTIFICATION = "ARCHIVE_NOTIFICATION",
}

export interface MessageData {
  recipientName: string;
  details?: string;
  code?: string;
}

export class MessageGenerator {
  private variations = {
    greetings: ["Olá", "Oi", "Tudo bem,", "Saudações"],
    closings: [
      "Atenciosamente, TPE Digital.",
      "Até logo!",
      "Tenha um ótimo dia!",
      "Qualquer dúvida, entre em contato.",
    ],
  };

  private templates: Record<MessageType, string[]> = {
    [MessageType.INVITATION]: [
      "[GREETING] [NAME], você tem uma nova designação. [DETAILS]. [CLOSING]",
      "[GREETING] [NAME]! Passando para avisar da sua nova designação: [DETAILS]. [CLOSING]",
      "[GREETING] [NAME], sua presença é solicitada para: [DETAILS]. [CLOSING]",
    ],
    [MessageType.CANCELLATION]: [
      "[GREETING] [NAME], infelizmente sua designação foi cancelada: [DETAILS]. [CLOSING]",
      "[GREETING] [NAME], houve uma alteração e sua participação não será mais necessária em: [DETAILS]. [CLOSING]",
      "[GREETING] [NAME], avisamos que a atividade [DETAILS] foi cancelada. [CLOSING]",
    ],
    [MessageType.OTP]: [
      "[GREETING] [NAME], seu código de acesso é *[CODE]*. Expira em 5 min. [CLOSING]",
      "[GREETING] [NAME], use o código *[CODE]* para validar seu login no TPE Digital. [CLOSING]",
      "[GREETING] [NAME], seu código de verificação: *[CODE]*. Não compartilhe. [CLOSING]",
    ],
    [MessageType.IN_PROGRESS_REMINDER]: [
      "[GREETING] [NAME], sua designação já está em andamento: [DETAILS]. [CLOSING]",
      "[GREETING] [NAME], lembramos que você está em atividade agora: [DETAILS]. [CLOSING]",
      "[GREETING] [NAME], não esqueça da sua designação atual: [DETAILS]. [CLOSING]",
    ],
    [MessageType.CRITICAL_REMINDER]: [
      "[GREETING] [NAME]! Sua designação começa em menos de 2 horas: [DETAILS]. [CLOSING]",
      "[GREETING] [NAME], lembrete importante: faltam menos de 2h para sua atividade [DETAILS]. [CLOSING]",
      "[GREETING] [NAME], você tem uma designação começando em breve: [DETAILS]. [CLOSING]",
    ],
    [MessageType.POST_EVENT_FOLLOW_UP]: [
      "[GREETING] [NAME], como foi sua participação em [DETAILS]? Deixe seu feedback. [CLOSING]",
      "[GREETING] [NAME], esperamos que tenha corrido tudo bem em [DETAILS]. [CLOSING]",
      "[GREETING] [NAME], obrigado por sua ajuda em [DETAILS]. [CLOSING]",
    ],
    [MessageType.COORDINATOR_ALERT]: [
      "[GREETING] [NAME], a designação [DETAILS] foi aberta com menos de 2 horas para o início. Por favor, verifique se todos estão cientes. [CLOSING]",
      "[GREETING] [NAME]! Alerta de designação próxima: [DETAILS] foi aberta recentemente e começa em menos de 2h. [CLOSING]",
      "[GREETING] [NAME], atenção: a atividade [DETAILS] inicia em breve e foi aberta agora. [CLOSING]",
    ],
    [MessageType.COMPLETED_NOTIFICATION]: [
      "[GREETING] [NAME]! A designação [DETAILS] foi CONCLUÍDA. Os participantes têm 48 horas para justificar ausências. [CLOSING]",
      "[GREETING] [NAME], informamos que a atividade [DETAILS] terminou. Justificativas em até 48h. [CLOSING]",
      "[GREETING] [NAME], participação em [DETAILS] encerrada. Se não esteve presente, favor justificar no app. [CLOSING]",
    ],
    [MessageType.ARCHIVE_NOTIFICATION]: [
      "[GREETING] [NAME], a designação de [DETAILS] foi arquivada. Novas designações já podem ser feitas. [CLOSING]",
      "[GREETING] [NAME]! Atividade [DETAILS] finalizada no sistema. Período de justificativa encerrado. [CLOSING]",
      "[GREETING] [NAME], passando para avisar que [DETAILS] foi arquivada com sucesso. [CLOSING]",
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

    return message;
  }

  private getRandom(array: any[]): any {
    return array[Math.floor(Math.random() * array.length)];
  }
}
