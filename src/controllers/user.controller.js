import asynchandler from '../utils/asynchandler.js';
import {ApiError} from '../utils/Apierror.js'
import {user} from "../models/user.model.js"
import {uploadOnCloud} from "../utils/cloudinary.js"
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';


const generaterefreshtokenandaccesstoken=async(userid)=>{
    try{
        const finduser=await user.findById(userid);
        const accesstoken=finduser.generateAccessToken();
        const refreshtoken=finduser.genereaterefreshtoken();
        console.log(accesstoken);
        console.log(refreshtoken);
        finduser.refreshtokens=refreshtoken;
        await finduser.save({validateBeforeSave:false});

        return {atoken: accesstoken ,rtoken: refreshtoken }
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

const refreshaccesstoken=asynchandler(async(req,res)=>{
    try {
        const incomingtoken=req.cookies.refreshToken || req.body.refreshtoken
    
        if(!incomingtoken){
            throw new ApiError(
                401,
                "unauthorized request"
            )
        }
    
        const decodedtoken=jwt.verify(
            incomingtoken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const find_user= await user.findById(decodedtoken._id)
    
        if(!find_user){
            throw new ApiError(
                401,
                "invalid refresh token"
            )
        }
        if(incomingtoken!==find_user?.refreshtoken){
            throw new ApiError(401,"refresh token is expired or used")
        }
        const options={
            httpOnly:true,
            secure:true
        }
    
        const {atoken,rtoken}=await generaterefreshtokenandaccesstoken(decodedtoken._id)
        return res.status(200)
        .cookie("accessToken",atoken,options)
        .cookie("refreshToken",rtoken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,atoken
                },
                "refreshed token"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid token sent")
        
    }
})

const changepassword=asynchandler(async(req,res)=>{
    const {oldpassword,newpassword}=req.body

    const isuser=await user.findById(req.body?._id);
    if(!isuser){
        throw new ApiError(
            420,"unauthorised request"
        )
    }

    const istrue=await isuser.isPasswordCorrect(oldpassword);

    if(!istrue){
        throw new ApiError(420,
            "wrong password"
        )
    }
    isuser.password=newpassword;
    await isuser.save({validateBeforeSave :false})

    res.status(200).json(
        new ApiResponse(200,
            "password changed"
        )
    )
})

const getcurrentuser=asynchandler(async(req,res)=>{
    return res.status(200).json(200,req.user,"userfetched success")
})

const updateinfo=asynchandler(async(req,res)=>{
    const {fullname,email}=req.body

    if(
        [fullname,email].some(
            (field)=>{
                field?.trim ===""
            }
        )
    ){
        throw new ApiError(405,"enter valid details")
    }

    const fuser=await user.findByIdAndUpdate(req._id,{
        fullname,
        email
    },{
        new:true
    }).select("-password")
    if(!fuser){
        throw new ApiError(406,"unable to updata you details")
    }

    return res.status(200).json(200,fuser,"updated info success")
})
const update_useravatar=asynchandler(async(req,res)=>{
    const avatarlocal=await req.file?.path
    if(!avatarlocal){
        throw new ApiError(404,"avatar file not found")
    }

    const fuser=await user.findById(req._id)

    if(!fuser){
        throw new ApiError(420,"unauthorized request")
    }
    const cloudpath=await uploadOnCloud(avatarlocal)
    if(!cloudpath){
        throw new ApiError(503,"unable to upload the avatar")
    }

    fuser.avatar=cloudpath.url;
    fuser.save({validateBeforeSave:false})

    return res.status(200).json(new ApiResponse(200,fuser.select("-password"),"avatar update success"
    ))
})
const update_usercover=asynchandler(async(req,res)=>{
    const coverlocal=await req.file?.path
    if(!avatarlocal){
        throw new ApiError(404,"cover image file not found")
    }

    const fuser=await user.findById(req._id)

    if(!fuser){
        throw new ApiError(420,"unauthorized request")
    }
    const cloudpath=await uploadOnCloud(coverlocal)
    if(!cloudpath){
        throw new ApiError(503,"unable to upload the coverimage")
    }

    fuser.coverimage=cloudpath.url;
    fuser.save({validateBeforeSave:false})

    return res.status(200).json(new ApiResponse(200,fuser.select("-password"),"cover image update success"
    ))
})
export {registerUser,loginUser,logoutuser,refreshaccesstoken,changepassword,getcurrentuser,updateinfo,update_useravatar,update_usercover}