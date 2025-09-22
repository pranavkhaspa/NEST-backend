import Opportunity from '../Models/opportunity.js';

export const getAllOpportunities = async (req, res) => {
    try {
        const query = {};
        if (req.query.type) {
            query.type = req.query.type;
        }
        if (req.query.skills) {
            query.skills = { $in: req.query.skills.split(',') };
        }

        const sort = {};
        if (req.query.sortBy && req.query.sortOrder) {
            const field = req.query.sortBy;
            const order = req.query.sortOrder === 'desc' ? -1 : 1;
            sort[field] = order;
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || parseInt(req.query.show) || 10;
        const skip = (page - 1) * limit;

        const opportunities = await Opportunity.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const totalCount = await Opportunity.countDocuments(query);

        res.status(200).json({
            total: totalCount,
            page,
            pages: Math.ceil(totalCount / limit),
            limit,
            data: opportunities,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getOpportunityById = async (req, res) => {
    try {
        const opportunity = await Opportunity.findOne({ id: req.params.id });
        if (!opportunity) {
            return res.status(404).json({ message: "Opportunity not found" });
        }
        res.status(200).json(opportunity);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};