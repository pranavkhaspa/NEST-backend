import express from 'express';
import * as postController from '../Controllers/PostController.js';

const router = express.Router();

// CREATE a new post
router.post('/', postController.createPost);

// READ all posts
router.get('/', postController.getAllPosts);

// READ a single post by ID
router.get('/:id', postController.getPostById);

// UPDATE a post by ID
router.put('/:id', postController.updatePost);

// DELETE a post by ID
router.delete('/:id', postController.deletePost);

// Route for upvoting and downvoting a post
router.post('/:id/vote', postController.votePost);

// Route for adding a new comment to a post
router.post('/:id/comment', postController.addComment);

// Route for replying to a comment on a post
router.post('/:postId/comment/:commentId/reply', postController.addCommentReply);

export default router;
