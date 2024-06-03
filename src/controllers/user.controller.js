import asynchandler from '../utils/asynchandler.js';
import {ApiError} from '../utils/Apierror.js'
import {user} from "../models/user.model.js"
import {uploadOnCloud} from "../utils/cloudinary.js"
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser =asynchandler(async(req,res)=>{
    res.status(200).json({
        message : "ok"
    })

    const {fullname,email,username,password}=req.body;
    console.log(email);
    
    if(
        [fullname,email,username,password].some(
            (field)=>{
                field?.trim()===""
            }
        )
    ){
        throw new ApiError(400,"fields can not be empty")

    }

    const existeduser =user.findOne({
        $or :[{username},{email}]
    })
    if(existeduser){
        throw new ApiError(409,"username or mail already exist");
    }


    const avatarlocal=req.files?.avatar[0]?.path;

    const coverlocal=req.files?.coverimage[0]?.path;

    if(!avatarlocal){
        throw new ApiError(400,"avatar required")

    }
    const avatarimg=await uploadOnCloud(avatarlocal);
    const coverimg=await uploadOnCloud(coverlocal);
    if(!avatarimg){
        throw new ApiError(400,"avatar required")
    }
    const createaduser =await user.create({
        fullname,
        avatar : avatarimg.url,
        coverimage :coverimg?.url || "",
        password,
        username,
        email
    }
    )
    const createduser1=await user.findById(createaduser._id).select("-password -refreshtokens");

    if(!createduser1){
        throw new ApiError(500,"unable to register the user");
    }

    return res.status(201).json(
        new ApiResponse(200,createduser1,"user registered")
    )

})

export {registerUser}