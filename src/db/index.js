import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async ()=>{
    try{
        const connectionInstance = await mongoose.connect('${MONGODB_URI}/${DB_NAME}');
        console.log("Mongodb_connected");
    }
    catch(error) {
        console.log("ERROR!",error);
        throw error;
        process.exit(1);
    }

}

export default connectDB;