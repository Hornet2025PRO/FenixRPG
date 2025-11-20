
import { Peer, DataConnection } from "peerjs";

// Define NetworkMessage here to avoid circular dependency issues if needed, 
// or import if build system allows. Using `any` for payload flexibility.
export interface NetworkMessage {
    type: 'SYNC_STATE' | 'PLAYER_ACTION' | 'GAME_START';
    payload: any;
}

class PeerService {
    private peer: Peer | null = null;
    private conn: DataConnection | null = null;
    private onDataCallback: ((data: NetworkMessage) => void) | null = null;

    // Initialize as Host
    public async initializeHost(): Promise<string> {
        return new Promise((resolve, reject) => {
            // Create a random ID for the host
            this.peer = new Peer();

            this.peer.on('open', (id) => {
                console.log('My peer ID is: ' + id);
                resolve(id);
            });

            this.peer.on('connection', (connection) => {
                console.log('Incoming connection from guest');
                this.conn = connection;
                this.setupConnectionHandlers();
            });

            this.peer.on('error', (err) => {
                console.error(err);
                reject(err);
            });
        });
    }

    // Join as Guest
    public async joinGame(hostId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.peer = new Peer();

            this.peer.on('open', () => {
                if (!this.peer) return;
                const connection = this.peer.connect(hostId);
                
                connection.on('open', () => {
                    console.log("Connected to host: " + hostId);
                    this.conn = connection;
                    this.setupConnectionHandlers();
                    resolve();
                });

                connection.on('error', (err) => {
                    reject(err);
                });
            });

            this.peer.on('error', (err) => {
                reject(err);
            });
        });
    }

    private setupConnectionHandlers() {
        if (!this.conn) return;

        this.conn.on('data', (data) => {
            console.log("Received data:", data);
            if (this.onDataCallback) {
                this.onDataCallback(data as NetworkMessage);
            }
        });

        this.conn.on('close', () => {
            console.log("Connection closed");
            // Handle disconnection if necessary
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
        if (this.conn) {
            this.conn.close();
        }
        if (this.peer) {
            this.peer.destroy();
        }
        this.conn = null;
        this.peer = null;
    }
}

export const peerService = new PeerService();
