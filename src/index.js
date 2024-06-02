import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import app from './app.js';

dotenv.config({
    path: './env'
})

connectDB()
.then(
    app.on((error)=>{
        console.log("error occuerd ",error);

    }),
    app.listen((process.env.PORT||8000),()=>{
        console.log("server is runnig at ${process.env.PORT}")

    })
)
.catch(
(error)=>{
    console.log("error in connecting  ",error);
}
)

