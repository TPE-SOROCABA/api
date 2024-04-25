export class ParticipantUtils {
  static calculateComputedField({ name, phone }: { name: string; phone: string }) {
    return `${name} ${phone}`;
  }
}
