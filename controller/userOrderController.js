

const Order = require('../models/orderModels');
const User = require('../models/UserModel');
const PDFDocument = require('pdfkit');

const cancelOrder = async (req, res) => {
    try {

        const { orderId } = req.body;
        const order = await Order.findOneAndUpdate(
            { orderId: orderId },
            { $set: { orderStatus: "Cancelled" } },
            { new: true }
        );
        if (order) {
            console.log('Order status updated');
            res.status(200).send({ success: true, message: 'Order status updated successfully', order });
        } else {
            res.status(404).send({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ success: false, message: 'Internal server error' });
    }
};

const   returnOrderLoad= async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const order=await Order.findOne({orderId:orderId})
        const user=req.session.user
       res.render("returnOrder",{order,user})
    } catch (error) {
        console.log(error.message);
    }
};


const   returnOrder= async (req, res) => {
    try {
        const { orderId, returnReason } = req.body;
        console.log(returnReason)
        console.log(orderId) 
        const order = await Order.findOneAndUpdate(
            { orderId: orderId },
            { $set: { orderStatus: "Returned", returnReason: returnReason } },
            { new: true }
        );
        if (order) {
            console.log('Order status updated');
            res.status(200).send({ success: true, message: 'Order status updated successfully', order });
        } else {
            res.status(404).send({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        console.log(error.message);
    }
};


const downloadInvoice = async (req, res) => {
    try {
        const { orderId } = req.body; // Retrieve orderId from request body

        // Fetch the specific order from the database
        const order = await Order.findOne({ orderId: orderId })
            .populate('userId', 'name')
            .populate('items.productId', 'name price')
            .exec();

        if (!order) {
            return res.status(404).send('Order not found');
        }

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=invoice_' + orderId + '.pdf');

        doc.pipe(res);

        // Title and Header
        doc.fontSize(30).font('Helvetica-Bold').text('TAX INVOICE', { align: 'center' });
        doc.fontSize(20).font('Helvetica').text('CHRONOLUX', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text('Rush Games Pvt Ltd, KINFRA Techno Industrial Park,', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text('National Highway 66, near Calicut University', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text('Kakkanchery Chelembra PO, Dt, Thenhipalam, Kerala 673634', { align: 'center' });

        doc.moveDown();

        // Order Details
        doc.fontSize(12).font('Helvetica-Bold').text('Order ID:', { continued: true }).font('Helvetica').text(` ${order.orderId}`, { align: 'left' });
        doc.font('Helvetica-Bold').text('Order Date:', { continued: true }).font('Helvetica').text(` ${new Date(order.currendDate).toLocaleDateString('en-IN')}`, { align: 'left' });
        doc.font('Helvetica-Bold').text('Customer Name:', { continued: true }).font('Helvetica').text(` ${order.address[0]?.name || 'N/A'}`, { align: 'left' });
        doc.font('Helvetica-Bold').text('Delivery Address:', { continued: true }).font('Helvetica').text(` ${order.address[0]?.home_address || 'N/A'}, ${order.address[0]?.city || 'N/A'}, ${order.address[0]?.district || 'N/A'}, ${order.address[0]?.state || 'N/A'}, ${order.address[0]?.pincode || 'N/A'}`, { align: 'left' });
        doc.moveDown(2);

        // Table Header
        const tableHeader = ['Product Name', 'Quantity', 'Price', 'Discount Amount', 'Total Amount', 'Status'];
        const cellWidths = [150, 60, 80, 100, 80, 100]; // Adjust widths to fit within the page
        const startX = doc.page.margins.left;
        let startY = doc.y;
        const rowHeight = 20;
        const tableHeaderBgColor = '#cccccc';
        const tableHeaderTextColor = '#000000';
        const tableCellTextColor = '#000000';

        // Draw header row
        doc.fillColor(tableHeaderBgColor);
        doc.rect(startX, startY, cellWidths.reduce((a, b) => a + b, 0), rowHeight).fill();
        doc.fillColor(tableHeaderTextColor);
        let currentX = startX;
        tableHeader.forEach((header, index) => {
            doc.fontSize(10).font('Helvetica-Bold').text(header, currentX, startY + 5, { width: cellWidths[index], align: 'center' });
            currentX += cellWidths[index];
        });

        // Move to next row
        startY += rowHeight;

        let currentY = startY;
        let sumTotal = 0;

        // Table Rows
        order.items.forEach(item => {
            currentX = startX;
            const itemTotal = (item.price - (item.discountAmount || 0)) * (item.quantity || 0);
            sumTotal += itemTotal;

            const rowData = [
                item.productId?.name || 'N/A',
                item.quantity || 0,
                (item.price || 0).toFixed(2),
                (item.discountAmount || 0).toFixed(2),
                itemTotal.toFixed(2),
                order.orderStatus || 'N/A'
            ];

            rowData.forEach((data, index) => {
                doc.fillColor(tableCellTextColor).fontSize(10).font('Helvetica').text(data, currentX, currentY + 5, { width: cellWidths[index], align: 'left' });
                currentX += cellWidths[index];
            });

            currentY += rowHeight;

            if (currentY > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
                currentY = doc.page.margins.top;

                // Re-add table header if a new page is added
                currentX = startX;
                doc.fillColor(tableHeaderBgColor);
                doc.rect(startX, currentY, cellWidths.reduce((a, b) => a + b, 0), rowHeight).fill();
                doc.fillColor(tableHeaderTextColor);
                tableHeader.forEach((header, index) => {
                    doc.fontSize(10).font('Helvetica-Bold').text(header, currentX, currentY + 5, { width: cellWidths[index], align: 'center' });
                    currentX += cellWidths[index];
                });
                currentY += rowHeight;
            }
        });

        // Total Amount 
        currentY += 20;
        doc.fontSize(12).font('Helvetica-Bold').text('Total Amount:', startX, currentY);
        doc.font('Helvetica').text(sumTotal.toFixed(2), startX + 200, currentY);

        doc.end();
    } catch (error) {
        console.error('An error occurred while generating the PDF:', error);
        res.status(500).send('An error occurred while generating the PDF.');
    }
};


module.exports={
    cancelOrder,
    returnOrderLoad,
    returnOrder,
    downloadInvoice
}