import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import multer from "multer";
import path from "path";
import messageRoutes from "./routes/messages.js";
import userRoutes from "./routes/users.js";
import authRoutes from "./routes/auth.js";
import connection from './database/database.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/messages", messageRoutes);
app.use("/users", userRoutes);
app.use("/auth", authRoutes);

const onlineUsers = {};

io.on("connection", (socket) => {
    console.log("A user connected");

    const userId = socket.handshake.query.userId;
    if (userId) {
        onlineUsers[userId] = true;
        io.emit("user status", { userId, status: "online" });
    }

    socket.on("disconnect", () => {
        console.log("User disconnected");
        if (userId) {
            delete onlineUsers[userId];
            io.emit("user status", { userId, status: "offline" });
        }
    });

    socket.on("chat message", async (msg) => {
        console.log("message: " + msg);
        try {
            const [result] = await connection.query(`
                INSERT INTO messages (sender_id, receiver_id, message_text, image) 
                VALUES (?, ?, ?, ?)
                `, [msg.sender_id, msg.receiver_id, msg.message_text, msg.file_name]);

            io.emit("chat message", { id: result.insertId, ...msg, created_at: new Date() });
            
        } catch (error) {
            console.error("Error saving message:", error.message);
        }
    });
});

app.post('/upload', upload.single('image'), (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }
    res.json({ fileName: file.filename });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port: http://localhost:${PORT}`);
});
