import express from "express";
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  votePost,
  addComment,
  addCommentReply,
  voteComment,
  voteReply,
} from "../Controllers/PostController.js";

const router = express.Router();

router.post("/", createPost);
router.get("/", getAllPosts);
router.get("/:id", getPostById);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);
router.post("/:id/vote", votePost);
router.post("/:id/comment", addComment);
router.post("/:postId/comment/:commentId/reply", addCommentReply);
router.post("/:postId/comment/:commentId/vote", voteComment);
router.post("/:postId/comment/:commentId/reply/:replyId/vote", voteReply);

export default router;
