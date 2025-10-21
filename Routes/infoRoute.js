import express from 'express';
const router = express.Router();

// Define the route for the API info
router.get('/', (req, res) => {
    const apiInfo = {
        name: "NEST API",
        version: "1.0.0",
        description: "A skill-based collaboration hub for students.",
        endpoints: {
            auth: {
                path: "/api/users",
                description: "User authentication and registration.",
                methods: {
                    "POST /register": {
                        description: "Register a new user.",
                        input: "JSON object with user details (name, email, username, password).",
                        output: "JSON object with a JWT token."
                    },
                    "POST /login": {
                        description: "Authenticate a user and get a JWT token.",
                        input: "JSON object with user credentials (email, password).",
                        output: "JSON object with a JWT token."
                    }
                }
            },
            users: {
                path: "/api/users",
                description: "Manage student profiles.",
                methods: {
                    "POST /": {
                        description: "Create a new user.",
                        input: "JSON object with user details (e.g., { name: 'John Doe', email: 'john@example.com' }).",
                        output: "JSON object with the newly created user's data."
                    },
                    "GET /": {
                        description: "Get all users.",
                        input: "None.",
                        output: "JSON object containing a list of all users."
                    },
                    "GET /:id": {
                        description: "Get a single user by ID.",
                        input: "User ID as a URL parameter (e.g., /api/users/60c72b2f9b1d8c1e2c8b4567).",
                        output: "JSON object with the requested user's data."
                    },
                    "PUT /:id": {
                        description: "Update a user by ID.",
                        input: "User ID as a URL parameter and a JSON object with the fields to update.",
                        output: "JSON object with the updated user's data."
                    },
                    "DELETE /:id": {
                        description: "Delete a user by ID.",
                        input: "User ID as a URL parameter.",
                        output: "JSON object with a success message."
                    },
                    "POST /:id/vote": {
                        description: "Upvote or downvote a user.",
                        input: "User ID as a URL parameter and a JSON object with the vote type and voter's ID (e.g., { voteType: 'upvote', voterId: '...' }).",
                        output: "JSON object with the updated user data including the new vote count."
                    },
                    "GET /profiles": {
                        description: "Fetch and update profiles for all users from external platforms (GitHub, LeetCode).",
                        input: "None.",
                        output: "JSON object with a success message."
                    },
                    "GET /:id/profile": {
                        description: "Fetch and update a single user's profile from external platforms.",
                        input: "User ID as a URL parameter.",
                        output: "JSON object with the updated user data."
                    }
                }
            },
            posts: {
                path: "/api/posts",
                description: "Manage discussion posts.",
                methods: {
                    "POST /": {
                        description: "Create a new post with AI tags and summary.",
                        input: "JSON object with the post content and user ID (e.g., { content: '...', userId: '...' }).",
                        output: "JSON object with the newly created post data, including the AI-generated summary and tags."
                    },
                    "GET /": {
                        description: "Get all posts.",
                        input: "None.",
                        output: "JSON object containing a list of all posts."
                    },
                    "GET /:id": {
                        description: "Get a single post by ID.",
                        input: "Post ID as a URL parameter.",
                        output: "JSON object with the requested post's data."
                    },
                    "PUT /:id": {
                        description: "Update a post by ID.",
                        input: "Post ID as a URL parameter and a JSON object with the fields to update.",
                        output: "JSON object with the updated post's data."
                    },
                    "DELETE /:id": {
                        description: "Delete a post by ID.",
                        input: "Post ID as a URL parameter.",
                        output: "JSON object with a success message."
                    },
                    "POST /:id/vote": {
                        description: "Upvote or downvote a post.",
                        input: "Post ID as a URL parameter and a JSON object with the vote type and user's ID (e.g., { voteType: 'upvote', userId: '...' }).",
                        output: "JSON object with the updated post data including the new vote count."
                    },
                    "POST /:id/comment": {
                        description: "Add a new comment to a post.",
                        input: "Post ID as a URL parameter and a JSON object with the comment text and user ID (e.g., { text: '...', commentedBy: '...' }).",
                        output: "JSON object with the updated post data including the new comment."
                    },
                    "POST /:postId/comment/:commentId/reply": {
                        description: "Reply to a specific comment on a post.",
                        input: "Post and comment IDs as URL parameters, and a JSON object with the reply text and user ID.",
                        output: "JSON object with the updated post data including the new reply."
                    }
                }
            },
            opportunities: {
                path: "/api/opportunities",
                description: "Retrieve a list of competitions and opportunities from Unstop.",
                methods: {
                    "GET /": {
                        description: "List all competitions with pagination and filtering.",
                        input: "Optional URL query parameters for filtering and sorting.",
                        output: "JSON object with paginated and filtered opportunities."
                    },
                    "GET /:id": {
                        description: "Get a single competition by its unique ID.",
                        input: "Opportunity ID as a URL parameter.",
                        output: "JSON object with the requested opportunity's data."
                    }
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
            author: "Pranav Khaspa",
            github: "https://github.com/pranavkhaspa"
        }
    };

    res.status(200).json(apiInfo);
});

export default router;
