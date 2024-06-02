import mongoose,{Schema} from "mongoose";
import { user } from "./user.model";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoschema=new Schema({
    videofile:{
        type:String,
        required:true
    },
    thumbnail:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type:Number,
        required:true
    },
    view:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"user"
    }
},
{
    timestamps:true
});
videoschema.plugin(mongooseAggregatePaginate)


export const video=mongoose.model("video",videoschema)