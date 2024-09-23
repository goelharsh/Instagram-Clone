import express, { urlencoded } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { configDotenv } from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "../backend/routes/user.route.js"
import postRoute from "../backend/routes/post.route.js"
import messageRoute from "../backend/routes/message.route.js"
import {app, server} from "./socket/socket.js"
import path from "path"
configDotenv();
// const app = express();
const PORT = process.env.PORT || 3000

// it will provide the complete path of our backend directory 
const __dirname = path.resolve();

//middlewares
app.get("/", (req,res)=>{
    return res.status(200).json({
        message:"Server is running",
        success: true
    })
})
app.use(express.json())

// we will store token in cookies so to use them we will use it 
app.use(cookieParser());
app.use(urlencoded({extended:true}));
const corsOptions = {
    // origin:"http://localhost:5173",
    origin:"https://instagram-clone-j0jn.onrender.com",
    credentials:true,
}
app.use(cors(corsOptions));

app.use(cors(corsOptions))

app.use("/api/v1/user", userRoute);
app.use("/api/v1/post", postRoute);
app.use("/api/v1/message", messageRoute);

app.use(express.static(path.join(__dirname, "/frontend/dist")));
app.get("*", (req,res)=>{
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
})

server.listen(PORT, ()=>{
    connectDB()
    console.log(`Server running at ${PORT}`);
})