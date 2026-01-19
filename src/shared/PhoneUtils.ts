export class PhoneUtils {
    static normalize(phone: string): string {
        if (!phone) return "";
        // Remove tudo que não for número
        const normalized = phone.replace(/\D/g, "");

        // Se tiver 13 dígitos e começar com 55, remove o 55
        if (normalized.length === 13 && normalized.startsWith("55")) {
            return normalized.substring(2);
        }

        return normalized;
    }
}
