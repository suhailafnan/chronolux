
const Order = require('../models/orderModels');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Category = require("../models/category");
const Products =require("../models/products"); 
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
         const fullOrders = await Order.find({ createdAt: { $gte: startDate, $lte: endDate } })
            .populate('userId', 'name')
            .populate('items.productId', 'name')
            .exec();

        const totalOrders = await Order.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });

        const totals = fullOrders.reduce((acc, order) => {
            acc.count += 1;
            acc.totalAmount += order.totalAmount;
            acc.totalDiscount += order.discountAmount || 0;
            return acc;
        }, { count: 0, totalAmount: 0, totalDiscount: 0 });

        res.render('salesReportPage', {
            orders,
            fullOrders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / ITEMS_PER_PAGE),
            filterType,
            startDate: req.query.startDate || '',
            endDate: req.query.endDate || '',
            ITEMS_PER_PAGE,
            totals,
            adminId: req.session.user_id,
            forEachedOrders: orders 
        });
    } catch (error) {
        console.error(error.message);
        res.render('errorPage');
    }
};


const downloadExcel = async (req, res) => {
    try {
     
        const orders = await Order.find({})
            .populate('userId', 'name')
            .populate('items.productId', 'name price')
            .exec();

   
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

       
        worksheet.columns = [
            { header: 'SL.NO', key: 'slNo', width: 10 },
            { header: 'Order Date', key: 'orderDate', width: 20 },
            { header: 'User Name', key: 'userName', width: 20 },
            { header: 'Order ID', key: 'orderId', width: 20 },
            { header: 'Product Name', key: 'productName', width: 30 },
            { header: 'Product Price', key: 'productPrice', width: 15 },
            { header: 'Offer Price', key: 'offerPrice', width: 15 },
            { header: 'Final Price', key: 'finalPrice', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
        ];

        let sumPrice = 0;
        let sumOffer = 0;
        let sumFinalPrice = 0;

        
        orders.forEach((order, index) => {
            order.items.forEach((item, itemIndex) => {
                const rowIndex = index * order.items.length + itemIndex + 1;
                worksheet.addRow({
                    slNo: rowIndex,
                    orderDate: order.currendDate.toISOString().split('T')[0],
                    userName: order.userId.name,
                    orderId: order.orderId,
                    productName: item.productId.name,
                    productPrice: item.price,
                    offerPrice: item.price - order.discountAmount / order.items.length,
                    finalPrice: order.totalAmount / order.items.length,
                    status: order.orderStatus,
                });
                sumPrice += item.price;
                sumOffer += (item.price - (order.discountAmount / order.items.length));
                sumFinalPrice += (order.totalAmount / order.items.length);
            });
        });

      
        worksheet.addRow({});
        worksheet.addRow({
            slNo: '',
            orderDate: '',
            userName: '',
            orderId: '',
            productName: 'Totals',
            productPrice: sumPrice,
            offerPrice: sumOffer,
            finalPrice: sumFinalPrice,
            status: ''
        });

    
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');

  
        await workbook.xlsx.write(res);
        res.status(200).end();

    } catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Error generating Excel file');
    }
};
 


const downloadPDF = async (req, res) => {
    try {
    
        const orders = await Order.find({})
            .populate('userId', 'name')
            .populate('items.productId', 'name price')
            .exec();

        const doc = new PDFDocument({ margin: 30 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=RGorders.pdf');

        doc.pipe(res);

        doc.fontSize(20).text('CHRONOLUX - SALES REPORT', { align: 'center' });
        doc.moveDown();

        const tableHeader = ['NO.', 'Order Date', 'Name', 'Order ID', 'Product Name', 'Price', 'Offer Price', 'Final Price', 'Status'];
        const cellWidths = [30, 90, 60, 60, 140, 50, 60, 60, 50];
        const tableStartX = 10;
        const startY = doc.y;
        const rowHeight = 20;
        const headerBackgroundColor = '#FFA500';

        let currentX = tableStartX;
        doc.fillColor(headerBackgroundColor);
        tableHeader.forEach((header, index) => {
            doc.rect(currentX, startY, cellWidths[index], rowHeight).fill();
            currentX += cellWidths[index];
        });

        currentX = tableStartX;
        doc.fillColor('black'); 
        tableHeader.forEach((header, index) => {
            doc.fontSize(10).font('Helvetica-Bold').text(header, currentX, startY + 5, { width: cellWidths[index], align: 'left' });
            currentX += cellWidths[index];
        });

        let sumPrice = 0;
        let sumOffer = 0;
        let sumFinalPrice = 0;
        let currentY = startY + rowHeight;

        orders.forEach((order, orderIndex) => {
            order.items.forEach((item, itemIndex) => {
                currentX = tableStartX;

                const rowData = [
                    orderIndex * order.items.length + itemIndex + 1,
                    order.currendDate.toISOString().split('T')[0],
                    order.userId.name,
                    order.orderId,
                    item.productId.name,
                    item.price.toFixed(2),
                    (item.price - (order.discountAmount / order.items.length)).toFixed(2),
                    (order.totalAmount / order.items.length).toFixed(2),
                    order.orderStatus
                ];
                sumPrice += item.price;
                sumOffer += item.price - (order.discountAmount / order.items.length);
                sumFinalPrice += order.totalAmount / order.items.length;

                rowData.forEach((data, i) => {
                    doc.fontSize(8).font('Helvetica').text(data.toString(), currentX, currentY, { width: cellWidths[i], align: 'left' });
                    currentX += cellWidths[i];
                });

                currentY += rowHeight;

                if (currentY > doc.page.height - doc.page.margins.bottom) {
                    doc.addPage();
                    currentY = startY;

                    currentX = tableStartX;
                    doc.fillColor('black');
                    tableHeader.forEach((header, index) => {
                        doc.fontSize(10).font('Helvetica-Bold').text(header, currentX, currentY + 5, { width: cellWidths[index], align: 'left' });
                        currentX += cellWidths[index];
                    });

                    currentY += rowHeight;
                }
            });
        });

        const totalRowData = ['', '', '', '', 'Total', sumPrice.toFixed(2), sumOffer.toFixed(2), sumFinalPrice.toFixed(2), ''];
        currentX = tableStartX;
        totalRowData.forEach((data, i) => {
            doc.fontSize(8).font('Helvetica-Bold').text(data.toString(), currentX, currentY, { width: cellWidths[i], align: 'left' });
            currentX += cellWidths[i];
        });

        doc.end();
    } catch (error) {
        console.error('Error generating PDF file:', error);
        res.status(500).send('Error generating PDF file');
    }
};

const adminBestSalePageLoad = async (req, res) => {
    try {
        const products = await Products.find().sort({ orderCount: -1 }).limit(3);
        const categories = await Category.find().sort({ orderCount: -1 }).limit(3);
        res.render("adminBestSalePage", { adminId: req.session.user_id, products, categories });
    } catch (error) {
        console.error(error.message);
        res.render('errorPage');
    }
};


module.exports = {
    loadSalesReport,
    downloadExcel,
     downloadPDF,
     adminBestSalePageLoad
};