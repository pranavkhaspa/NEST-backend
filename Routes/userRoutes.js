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

export default router;
