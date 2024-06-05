import { Router } from "express";
import { loginUser, logoutuser, registerUser,refreshaccesstoken } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { authuser } from "../middlewares/auth.middleware.js";

const router=Router();

router.route("/register").post(
    upload.fields(
        [
            {name :"avatar",
                maxCount:1
            },
            {name :"coverimage",
                maxCount:1
            }
        ]
    ),
    registerUser)


router.route("/login").post(loginUser);
//secure
router.route("/logout").post(authuser,logoutuser);
router.route("/refresh-token").post(refreshaccesstoken)

export default router;