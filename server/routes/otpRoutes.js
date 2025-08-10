
import express from "express";
import { sendOTP, verifyOTPAndResetPassword, resendOTP } from "../controllers/otpController.js";

const otpRouter = express.Router();

otpRouter.post("/sendOtp", sendOTP);
otpRouter.post("/verifyOtpReset", verifyOTPAndResetPassword);
otpRouter.post("/resendOtp", resendOTP);

export default otpRouter;
