export class ParticipantUtils {
  static calculateComputedField({ cpf, name, phone }: any): string {
    return `${cpf} ${name} ${phone}`;
  }
}
