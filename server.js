const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

console.log('🚀 Starting RSA Chat Server...');

// Simple room storage
const rooms = {};

wss.on('connection', (ws) => {
    console.log('✅ Client connected');
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            console.log('📩 Received:', message.type);
            
            if (message.type === 'join_room') {
                const { roomCode, username } = message;
                console.log(`🎯 ${username} joining room ${roomCode}`);
                
                // Create room if not exists
                if (!rooms[roomCode]) {
                    rooms[roomCode] = [];
                    console.log(`✅ Created room ${roomCode}`);
                }
                
                // Add user to room
                rooms[roomCode].push({ ws, username });
                
                // Send success back
                ws.send(JSON.stringify({
                    type: 'room_joined',
                    roomCode: roomCode,
                    username: username,
                    message: 'Berhasil masuk room!'
                }));
                
                console.log(`✅ ${username} joined room ${roomCode}`);
            }
            else if (message.type === 'send_message') {
                const { roomCode, encryptedMessage, username } = message;
                
                if (rooms[roomCode]) {
                    console.log(`📨 ${username} mengirim pesan`);
                    
                    // Broadcast to all in room except sender
                    rooms[roomCode].forEach(user => {
                        if (user.ws !== ws && user.ws.readyState === WebSocket.OPEN) {
                            user.ws.send(JSON.stringify({
                                type: 'new_message',
                                encryptedMessage: encryptedMessage,
                                username: username
                            }));
                        }
                    });
                }
            }
        } catch (error) {
            console.log('❌ Error:', error.message);
        }
    });
    
    ws.on('close', () => {
        console.log('❌ Client disconnected');
        // Remove from all rooms
        for (const roomCode in rooms) {
            rooms[roomCode] = rooms[roomCode].filter(user => user.ws !== ws);
            // Remove empty rooms
            if (rooms[roomCode].length === 0) {
                delete rooms[roomCode];
                console.log(`🗑️ Room ${roomCode} deleted (empty)`);
            }
        }
    });
});

// PORT 22113
const PORT = 22113;
const HOST = '0.0.0.0';

// Get IP address automatically
function getIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const alias of iface) {
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return 'localhost';
}

const SERVER_IP = getIPAddress();

server.listen(PORT, HOST, () => {
    console.log('🎉 SERVER BERHASIL DIJALANKAN!');
    console.log('🌐 Local: http://localhost:' + PORT);
    console.log('📱 External: http://' + SERVER_IP + ':' + PORT);
    console.log('');
    console.log('📝 CARA PAKAI:');
    console.log('1. Laptop Server: http://localhost:' + PORT);
    console.log('2. Perangkat Lain: http://' + SERVER_IP + ':' + PORT);
    console.log('3. Kode Room: opsional');
    console.log('4. Username berbeda di setiap perangkat');
    console.log('');
    console.log('🔒 Fitur RSA:');
    console.log('- Pengirim lihat kode enkripsi');
    console.log('- Penerima lihat pesan asli');
});

console.log('✅ Server loaded successfully!');