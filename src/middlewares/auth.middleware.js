import { user } from "../models/user.model.js"
import { ApiError } from "../utils/Apierror.js"
import asynchandler from "../utils/asynchandler.js"
import jwt from "jsonwebtoken"

const authuser=asynchandler(async(req,_,next)=>{

    try {
        const token=req.cookies?.accessToken || req.header("Authorization")?.("Bearer ","")
    
        if(!token){
            throw new ApiError(420,"unauthorized request")
        }
        const info=await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const isuser=await user.findById(info?._id).select("-password -refreshtokens")
    
        if(!isuser){
            throw new ApiError(404,"Invalid token")
        }
    
        req.user=isuser;
    
        next()
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid access token");
        
    }
})



export {authuser}