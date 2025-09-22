import mongoose from 'mongoose';

const opportunitySchema = new mongoose.Schema({
    // The 'unique: true' constraint has been removed to allow documents
    // to be saved even if the 'id' field is null or not unique.
    id: { type: String, required: false },
    title: { type: String, required: false },
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
