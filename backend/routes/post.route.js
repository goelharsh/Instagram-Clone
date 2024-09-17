import express from "express";

import upload from "../middlewares/multer.js";
import { addComment, addNewPost, allPosts, bookmarkPost, deletePost, disLikePost, getCommentsRelatedToPost, getMyPosts, likePost } from "../controllers/post.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.route("/addpost").post(isAuthenticated, upload.single('image'), addNewPost);
router.route("/all").get(isAuthenticated, allPosts);
router.route("/userpost/all").get(isAuthenticated, getMyPosts);
router.route("/:id/like").get(isAuthenticated, likePost);
router.route("/:id/dislike").get(isAuthenticated, disLikePost);
router.route("/:id/comment").post(isAuthenticated, addComment); 
router.route("/:id/comment/all").post(isAuthenticated, getCommentsRelatedToPost);
router.route("/delete/:id").delete(isAuthenticated, deletePost);
router.route("/:id/bookmark").get(isAuthenticated, bookmarkPost);

export default router;
