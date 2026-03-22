import mongoose from "mongoose";

export const connectDB = async ()=>{
    try {
        const connect = await mongoose.connect(process.env.MONGODB_URL);
        console.log('mongodb connect',connect.connection.host)
    } catch (error) {
        console.log('mongodb connection error',error);
    }
}