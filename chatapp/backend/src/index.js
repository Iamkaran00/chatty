
import express from "express";
import authRoutes from "./routes/auth.route.js";
import dotenv from 'dotenv';
import cors from "cors";
import cookieparser from "cookie-parser";
import { connectDB } from "../lib/db.js";
import messageroute from "./routes/message.route.js";
import { app ,server} from "../lib/socket.js";
dotenv.config();
const PORT = process.env.PORT;
app.use(express.json({ limit: "20mb" })); // for JSON requests, including base64 images
app.use(express.urlencoded({ limit: "40mb", extended: true })); // for form-urlencoded

app.use(cookieparser());
app.use(cors({
    origin :'https://chatapp-7kki.onrender.com',
    credentials:true,
}));
app.use('/api/v1/auth',authRoutes);
app.use('/api/v1/messages',messageroute);
server.listen(PORT,()=>{
    console.log('server running at port',PORT);
    connectDB();
});
