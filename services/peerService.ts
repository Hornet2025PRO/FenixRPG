
import { Peer, DataConnection } from "peerjs";

export interface NetworkMessage {
    type: 'SYNC_STATE' | 'PLAYER_ACTION' | 'GAME_START';
    payload: any;
}

class PeerService {
    private peer: Peer | null = null;
    private conn: DataConnection | null = null;
    private onDataCallback: ((data: NetworkMessage) => void) | null = null;

    private cleanup() {
        if (this.conn) {
            try { this.conn.close(); } catch(e) {}
        }
        if (this.peer) {
            try { this.peer.destroy(); } catch(e) {}
        }
        this.conn = null;
        this.peer = null;
    }

    // Initialize as Host
    public async initializeHost(): Promise<string> {
        this.cleanup();
        
        return new Promise((resolve, reject) => {
            this.peer = new Peer();

            this.peer.on('open', (id) => {
                console.log('Host initialized. ID:', id);
                resolve(id);
            });

            this.peer.on('connection', (connection) => {
                console.log('Incoming connection from guest');
                this.conn = connection;
                this.setupConnectionHandlers();
            });

            this.peer.on('error', (err) => {
                console.error("Peer Host Error:", err);
                reject(err);
            });
        });
    }

    // Join as Guest
    public async joinGame(hostId: string): Promise<void> {
        this.cleanup();

        return new Promise((resolve, reject) => {
            this.peer = new Peer();

            this.peer.on('open', () => {
                if (!this.peer) return;
                
                console.log(`Connecting to host: ${hostId}`);
                // reliable: true mejora la consistencia de datos para juegos
                const connection = this.peer.connect(hostId, { reliable: true });
                
                // Flag to track if connection opened successfully
                let isConnected = false;

                connection.on('open', () => {
                    console.log("Connected to host successfully");
                    isConnected = true;
                    this.conn = connection;
                    this.setupConnectionHandlers();
                    resolve();
                });

                connection.on('error', (err) => {
                    console.error("Connection Error:", err);
                    if (!isConnected) reject(err);
                });

                // Timeout de seguridad si la conexión se queda colgada
                setTimeout(() => {
                    if (!isConnected) {
                        // Si no conectó en 10s, rechazamos
                        reject(new Error("Tiempo de espera agotado al intentar conectar con la sala."));
                    }
                }, 10000);
            });

            // Catch specific peer errors like 'peer-unavailable'
            this.peer.on('error', (err: any) => {
                console.error("Peer Client Error:", err);
                if (err.type === 'peer-unavailable') {
                    reject(new Error("No se encontró la sala. Verifica el código."));
                } else {
                    reject(err);
                }
            });
        });
    }

    private setupConnectionHandlers() {
        if (!this.conn) return;

        this.conn.on('data', (data) => {
            if (this.onDataCallback) {
                this.onDataCallback(data as NetworkMessage);
            }
        });

        this.conn.on('close', () => {
            console.log("Connection closed");
        });
        
        this.conn.on('error', (err) => {
            console.error("DataConnection Error:", err);
        });
    }

    public send(message: NetworkMessage) {
        if (this.conn && this.conn.open) {
            this.conn.send(message);
        } else {
            console.warn("Cannot send message, connection not open.");
        }
    }

    public onData(callback: (data: NetworkMessage) => void) {
        this.onDataCallback = callback;
    }

    public disconnect() {
        this.cleanup();
    }
}

export const peerService = new PeerService();
