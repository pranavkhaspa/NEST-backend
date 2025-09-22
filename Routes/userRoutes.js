import express from 'express';
import * as userController from '../Controllers/UserController.js';

const router = express.Router();

// CREATE a new user
router.post('/', userController.createUser);

// READ all users
router.get('/', userController.getAllUsers);

// READ a single user by ID
router.get('/:id', userController.getUserById);

// UPDATE a user by ID
router.put('/:id', userController.updateUser);

// DELETE a user by ID
router.delete('/:id', userController.deleteUser);

// Route for upvoting and downvoting a user
router.post('/:id/vote', userController.voteUser);

// Route to fetch and update ALL user profiles
router.get("/profiles", userController.getProfile);

// Route to fetch and update a SINGLE user's profile
router.get("/:id/profile", userController.getSingleProfile);

export default router;
