import mongoose from 'mongoose';

const opportunitySchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    organizer: String,
    type: String,
    registered: Number,
    days_left: Number,
    skills: [String],
    image: String,
}, {
    timestamps: true
});

const Opportunity = mongoose.model('Opportunity', opportunitySchema);

export default Opportunity;
