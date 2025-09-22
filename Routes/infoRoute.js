import express from 'express';
const router = express.Router();

// Define the route for the API info
router.get('/', (req, res) => {
    const apiInfo = {
        name: "NEST API",
        version: "1.0.0",
        description: "A skill-based collaboration hub for students.",
        endpoints: {
            users: {
                path: "/api/users",
                description: "Manage student profiles.",
                methods: {
                    "POST /": "Create a new user.",
                    "GET /": "Get all users.",
                    "GET /:id": "Get a single user by ID.",
                    "PUT /:id": "Update a user by ID.",
                    "DELETE /:id": "Delete a user by ID.",
                    "POST /:id/vote": "Upvote or downvote a user."
                }
            },
            posts: {
                path: "/api/posts",
                description: "Manage discussion posts.",
                methods: {
                    "POST /": "Create a new post with AI tags and summary.",
                    "GET /": "Get all posts.",
                    "GET /:id": "Get a single post by ID.",
                    "PUT /:id": "Update a post by ID.",
                    "DELETE /:id": "Delete a post by ID.",
                    "POST /:id/vote": "Upvote or downvote a post.",
                    "POST /:id/comment": "Add a new comment to a post.",
                    "POST /:postId/comment/:commentId/reply": "Reply to a specific comment on a post."
                }
            },
            opportunities: { // ⬅️ New opportunities endpoint
                path: "/api/opportunities",
                description: "Retrieve a list of competitions and opportunities from Unstop.",
                methods: {
                    "GET /": "List all competitions with pagination and filtering.",
                    "GET /:id": "Get a single competition by its unique ID."
                },
                parameters: [
                    "page: The page number (e.g., ?page=2)",
                    "limit: Number of items per page (e.g., ?limit=20)",
                    "type: Filter by competition type (e.g., ?type=Hackathon)",
                    "skills: Filter by skills (e.g., ?skills=Web Development,Data Science)",
                    "sortBy: Field to sort by (e.g., ?sortBy=title)",
                    "sortOrder: Sort order, 'asc' or 'desc' (e.g., ?sortOrder=desc)"
                ]
            }
        },
        contact: {
            author: "Your Name",
            github: "Your GitHub Profile"
        }
    };

    res.status(200).json(apiInfo);
});

export default router;
