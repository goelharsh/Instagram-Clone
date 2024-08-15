import express, { urlencoded } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { configDotenv } from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "../backend/routes/user.route.js"
configDotenv();
const app = express();
const PORT = process.env.PORT || 3000

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
    origin:"http://localhost:5173",
    credential:true
}
app.use(cors(corsOptions))

app.use("/api/v1/user", userRoute);


app.listen(PORT, ()=>{
    connectDB()
    console.log(`Server running ${PORT}`);
})