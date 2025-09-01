import express from "express"
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express()

// cors 
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

// set limit of json data 
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


// router 
import userRouter from "./routes/user.routes.js";

// routes declaration
app.use("/api/v1/users",userRouter)



export default app;