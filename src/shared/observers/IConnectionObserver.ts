export interface IConnectionObserver {
    onConnected(): Promise<void>;
    onDisconnected(): Promise<void>;
}
