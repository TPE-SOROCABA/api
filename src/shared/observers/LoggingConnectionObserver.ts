import { IConnectionObserver } from "./IConnectionObserver";

export class LoggingConnectionObserver implements IConnectionObserver {
    async onConnected(): Promise<void> {
        console.log("[OBSERVER] Z-API Conectado. Sistema pronto para retomar envios.");
    }

    async onDisconnected(): Promise<void> {
        console.log("[OBSERVER] Z-API Desconectado. Circuito Aberto.");
    }
}
