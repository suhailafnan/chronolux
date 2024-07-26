

const Order = require('../models/orderModels');
const ITEMS_PER_PAGE = 6;

const loadSalesReport = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const filterType = req.query.filterType || 'all'; 
        let startDate, endDate;

        if (filterType === 'custom') {
            startDate = new Date(req.query.startDate);
            endDate = new Date(req.query.endDate);
            endDate.setHours(23, 59, 59, 999);
        } else {
            switch (filterType) {
                case 'daily':
                    startDate = new Date();
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date();
                    endDate.setHours(23, 59, 59, 999);
                    break;
                case 'weekly':
                    startDate = new Date();
                    startDate.setDate(startDate.getDate() - startDate.getDay());
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date();
                    endDate.setDate(endDate.getDate() - endDate.getDay() + 6);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                case 'yearly':
                    startDate = new Date(new Date().getFullYear(), 0, 1);
                    endDate = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);
                    break;
                case 'all':
                    startDate = new Date(0); 
                    endDate = new Date(); 
                    endDate.setHours(23, 59, 59, 999);
                    break;
            }
        }

        const orders = await Order.find({ createdAt: { $gte: startDate, $lte: endDate } })
            .populate('userId', 'name')
            .populate('items.productId', 'name')
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE)
            .exec();

        const totalOrders = await Order.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });

        // Calculate totals
        const totals = orders.reduce((acc, order) => {
            acc.count += 1;
            acc.totalAmount += order.totalAmount;
            acc.totalDiscount += order.discountAmount || 0;
            return acc;
        }, { count: 0, totalAmount: 0, totalDiscount: 0 });

        res.render('salesReportPage', {
            orders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / ITEMS_PER_PAGE),
            filterType,
            startDate: req.query.startDate || '',
            endDate: req.query.endDate || '',
            ITEMS_PER_PAGE,
            totals,
            adminId:req.session.user_id
        });
    } catch (error) {
        console.error(error.message);
        res.render('errorPage');
    }
};

module.exports = {
    loadSalesReport
};
