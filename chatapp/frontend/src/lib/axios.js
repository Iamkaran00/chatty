import axios from "axios";
export const axiosInstance = axios.create({
    baseURL : "https://chatty-0yi1.onrender.com/api/v1",
    withCredentials:true
    
})
