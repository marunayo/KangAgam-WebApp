// DashboardController.js
import VisitorLog from '../models/VisitorLogModel.js';
import Learner from '../models/LearnerModel.js';
import Topic from '../models/TopicModel.js';
import Admin from '../models/AdminModel.js';
import mongoose from 'mongoose';

const createDateFilter = (period) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let startDate;

    switch (period) {
        case 'daily':
            // Last 7 days
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 6);
            break;
        case 'weekly':
            // Current month (4/5 weeks in the current month)
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            break;
        case 'monthly':
            // Last 6 months
            startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
            break;
        case 'yearly':
            // Last 5 years
            startDate = new Date(today.getFullYear() - 4, 0, 1);
            break;
        default:
            return {};
    }
    
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    return { timestamp: { $gte: startDate, $lte: endDate } };
};

const getDateFormat = (period) => {
    switch (period) {
        case 'daily':
            return "%Y-%m-%d";
        case 'weekly':
            return "%Y-%U"; // Year-Week format
        case 'monthly':
            return "%Y-%m";
        case 'yearly':
            return "%Y";
        default:
            return "%Y-%m-%d";
    }
};

// ✅ NEW: Generate complete date range with zero-filled data
const generateCompleteRange = (period) => {
    const today = new Date();
    const ranges = [];
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    switch (period) {
        case 'daily':
            // Generate last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const key = date.toISOString().split('T')[0]; // YYYY-MM-DD
                const label = new Date(key).toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'short' 
                });
                ranges.push({ key, label, count: 0 });
            }
            break;

        case 'weekly':
            // Generate weeks in the current month up to today
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            const monthName = monthNames[currentMonth];
            const weeksInMonth = [];
            let currentDate = new Date(currentYear, currentMonth, 1);
            const endDate = new Date(today);

            while (currentDate <= endDate) {
                const week = getWeekNumber(currentDate);
                const year = currentDate.getFullYear();
                const key = `${year}-${String(week).padStart(2, '0')}`;
                if (!weeksInMonth.find(w => w.key === key)) {
                    weeksInMonth.push({ key, startDate: new Date(currentDate) });
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Sort by startDate (though sequential loop should already be ordered)
            weeksInMonth.sort((a, b) => a.startDate - b.startDate);

            // Assign labels like "Oktober-Minggu 1"
            weeksInMonth.forEach((w, index) => {
                ranges.push({ key: w.key, label: `${monthName}-Minggu ${index + 1}`, count: 0 });
            });
            break;

        case 'monthly':
            // Generate last 6 months
            for (let i = 5; i >= 0; i--) {
                const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const key = `${year}-${month}`;
                const label = `${monthNames[date.getMonth()]} ${year}`;
                ranges.push({ key, label, count: 0 });
            }
            break;

        case 'yearly':
            // Generate last 5 years
            for (let i = 4; i >= 0; i--) {
                const year = today.getFullYear() - i;
                const key = String(year);
                const label = String(year);
                ranges.push({ key, label, count: 0 });
            }
            break;
    }

    return ranges;
};

// Helper function to get ISO week number
const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

// ✅ NEW: Merge database results with complete range
const mergeWithCompleteRange = (dbResults, period) => {
    const completeRange = generateCompleteRange(period);
    const resultMap = new Map(dbResults.map(item => [item.label, item.count]));

    return completeRange.map(range => ({
        label: range.label,
        count: resultMap.get(range.key) || 0
    }));
};

export const getDashboardStats = async (req, res) => {
    try {
        const { visitorsPeriod = 'monthly', uniqueVisitorsPeriod = 'monthly', cityPeriod = 'monthly', topicPeriod = 'monthly' } = req.query;

        const visitorsDateFilter = createDateFilter(visitorsPeriod);
        const uniqueVisitorsDateFilter = createDateFilter(uniqueVisitorsPeriod);
        const cityDateFilter = createDateFilter(cityPeriod);
        const topicDateFilter = createDateFilter(topicPeriod);

        const visitorsDateFormat = getDateFormat(visitorsPeriod);
        const uniqueVisitorsDateFormat = getDateFormat(uniqueVisitorsPeriod);
        
        const [
            totalVisitors,
            totalUniqueVisitorsResult,
            visitorDistributionRaw,
            uniqueVisitorDistributionRaw,
            topicVisitDistribution,
            cityDistribution,
            totalTopics,
            totalAdmins
        ] = await Promise.all([
            VisitorLog.countDocuments(visitorsDateFilter),
            VisitorLog.aggregate([
                { $match: uniqueVisitorsDateFilter },
                { $group: { _id: "$learner" } },
                { $count: "count" }
            ]),
            VisitorLog.aggregate([
                { $match: visitorsDateFilter },
                { 
                    $group: { 
                        _id: { $dateToString: { format: visitorsDateFormat, date: "$timestamp" } }, 
                        count: { $sum: 1 } 
                    } 
                },
                { $sort: { "_id": 1 } },
                { $project: { _id: 0, label: "$_id", count: "$count" } }
            ]),
            VisitorLog.aggregate([
                { $match: uniqueVisitorsDateFilter },
                { 
                    $group: { 
                        _id: { 
                            date: { $dateToString: { format: uniqueVisitorsDateFormat, date: "$timestamp" } }, 
                            learner: "$learner" 
                        } 
                    } 
                },
                { $group: { _id: "$_id.date", count: { $sum: 1 } } },
                { $sort: { "_id": 1 } },
                { $project: { _id: 0, label: "$_id", count: "$count" } }
            ]),
            VisitorLog.aggregate([
                { $match: topicDateFilter },
                { $group: { _id: "$topic", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $lookup: { from: "topics", localField: "_id", foreignField: "_id", as: "topicDetails" } },
                { $unwind: "$topicDetails" },
                { $project: { _id: 0, topicId: "$_id", name: "$topicDetails.topicName", count: "$count" } }
            ]),
            VisitorLog.aggregate([
                { $match: cityDateFilter },
                { $lookup: { from: "learners", localField: "learner", foreignField: "_id", as: "learnerDetails" } },
                { $unwind: "$learnerDetails" },
                { $group: { _id: { learner: "$learner", city: "$learnerDetails.learnerCity" } } },
                { $group: { _id: "$_id.city", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 },
                { $project: { _id: 0, label: "$_id", count: "$count" } }
            ]),
            Topic.countDocuments(),
            Admin.countDocuments()
        ]);
        
        const totalUniqueVisitors = totalUniqueVisitorsResult[0]?.count || 0;

        // ✅ Merge with complete range to show all periods (including zeros)
        const visitorDistribution = mergeWithCompleteRange(visitorDistributionRaw, visitorsPeriod);
        const uniqueVisitorDistribution = mergeWithCompleteRange(uniqueVisitorDistributionRaw, uniqueVisitorsPeriod);

        res.status(200).json({
            totalVisitors,
            totalUniqueVisitors,
            visitorDistribution,
            uniqueVisitorDistribution,
            favoriteTopic: topicVisitDistribution[0] || {},
            topicDistribution: topicVisitDistribution,
            cityDistribution,
            mostfrequentcity: cityDistribution[0] || {},
            totalTopics,
            totalAdmins,
        });

    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data statistik.', error: error.message });
    }
};