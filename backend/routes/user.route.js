import express from "express";
import {
  editProfile,
  followOrUnfollow,
  getProfile,
  getSuggestedUsers,
  login,
  logout,
  register,
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").post(logout);
router.route("/:id/getProfile").get(isAuthenticated, getProfile);
router
  .route("/editProfile")
  .post(isAuthenticated, upload.single("profilePicture"), editProfile);
router.route("/getSuggestedUsers").get(isAuthenticated, getSuggestedUsers);
router.route("/followOrUnfollow/:id").post(isAuthenticated, followOrUnfollow);

export default router  