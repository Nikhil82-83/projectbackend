import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import app from './app.js';

dotenv.config({
    path: './env'
})

connectDB()
.then(
    app.listen(process.env.PORT||8000,(req,res)=>{
        console.log("server is runnig at ",process.env.PORT)
    })
)
.catch(
(error)=>{
    console.log("error in connecting  ",error);
}
)

