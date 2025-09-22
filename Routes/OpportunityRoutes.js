import express from 'express';
import { getAllOpportunities, getOpportunityById } from '../Controllers/OpportunityController.js';

const router = express.Router();

// Get all opportunities with filtering, sorting, and pagination
router.get('/', getAllOpportunities);

// Get a single opportunity by ID
router.get('/:id', getOpportunityById);

export default router;