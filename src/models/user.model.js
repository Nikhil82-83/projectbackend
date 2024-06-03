import mongoose,{Schema} from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const userSchema=new Schema({

    username:{
        type:String,
        unique:true,
        required:true,
        lowercase:true,
        trim:true,
        index: true
    },
    email:{
        type:String,
        unique:true,
        required:true,
        lowercase:true,
        trim:true,
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar: {
        type:String, //cloudnaryurl
        required :true
    },
    coverimage: {
        type:String, //cloudnaryurl
    },
    watchhistory: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"video"
    },
    password:{
        type: string,
        required:[true,"password required"]
    },
    refreshtokens:{
        type: string
    }
},
{
    timestamps:true
}
)

userSchema.pre("save",async function (next){
    if(!this.isModified("password")) return next();
    this.password=await bcrypt.hash(this.password, 10)
    next()
})
userSchema.methods.ispasswordcorrect= async function (){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname : this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY

        }
    )

}

userSchema.methods.genereaterefreshtoken= async function (){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY

        }
    )
}

export const user=mongoose.model("user",userSchema)