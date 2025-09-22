import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    // A post must be associated with a user.
    // The `ref` field tells Mongoose which model to link to.
    postedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    // The AI-generated tags and summary.
    tags: [String],
    summary: String,

    // Upvote/downvote for the post itself.
    votes: {
        upvotes: {
            type: Number,
            default: 0
        },
        downvotes: {
            type: Number,
            default: 0
        },
        voters: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    
    // An array of comments on this post.
    comments: [{
        text: String,
        commentedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        // Nested comments (replies on comments)
        replies: [{
            text: String,
            commentedBy: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        }],
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Post', PostSchema);