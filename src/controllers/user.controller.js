import asynchandler from '../utils/asynchandler.js';
import {ApiError} from '../utils/Apierror.js'
import {user} from "../models/user.model.js"
import {uploadOnCloud} from "../utils/cloudinary.js"
import { ApiResponse } from '../utils/ApiResponse.js';


const generaterefreshtokenandaccesstoken=async(userid)=>{
    try{
        const finduser=await user.findById(userid);
        const accesstoken=finduser.generateAccessToken();
        const refreshtoken=finduser.genereaterefreshtoken();
        finduser.refreshtokens=refreshtoken;
        await finduser.save({validateBeforeSave:false});

        return {
            accesstoken,refreshtoken
        }
    }
    catch(error){
        throw new ApiError(500,error)

    }

}

const registerUser =asynchandler(async(req,res)=>{
    const {fullname,email,username,password}=req.body;
    if(
        [fullname,email,username,password].some(
            (field)=>{
                field?.trim()===""
            }
        )
    ){
        throw new ApiError(400,"fields can not be empty")

    }

    const existeduser =await user.findOne({
        $or :[{username},{email}]
    })
    if(existeduser){
        throw new ApiError(409,"username or mail already exist");
    }


    const avatarlocal=req.files?.avatar[0]?.path;
    let coverlocal;
    if(req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length>0){
        coverlocal=req.files?.coverimage[0]?.path; 
    }

    

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

const loginUser=asynchandler(async(req,res)=>{

    const {email, username, password}=req.body;
    console.log(username);

    if(
        [username,email,password].some(
            (field)=>{
                field?.trim()==="";
            }
        )
    ){
        throw new ApiError(410,"username/email and password cannot be empty")
    }

    const userfind= await user.findOne({
        $or: [{username},{email}]
    })
    if(!userfind){
        throw new ApiError(415,"no user exist with given username/email")
    }

    const check=await userfind.isPasswordCorrect(password);

    if(!check){
        throw new ApiError(420,"credential failure");
    }

    const {atoken,rtoken}=await generaterefreshtokenandaccesstoken(userfind._id);

    const loggedinuser=await user.findById(userfind._id).select(
        "-password -refreshtokens"
    )

    const options={
        httpOnly : true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken",atoken,options)
    .cookie("refreshToken",rtoken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedinuser,
                accesstoken:atoken,
                refreshtoken:rtoken
            },
            "user logged in "
        )
    )
})

const logoutuser=asynchandler(async(req,res)=>{
    await user.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshtoken: undefined
            }
        },
            {
                new:true
            }
    )
    const options={
        httpOnly : true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user loggedout"))

})

export {registerUser,loginUser,logoutuser}