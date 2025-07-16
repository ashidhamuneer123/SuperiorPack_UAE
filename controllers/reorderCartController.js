import Product from "../models/Product.js";
import Category from "../models/Category.js";
import ReOrder from "../models/ReOrder.js";
import ReorderCounter from "../models/ReorderCounter.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import cloudinary from "../config/cloudinary.js";
import streamifier from 'streamifier';
import User from "../models/User.js";

export const addToReorderCart = async (req, res) => {
  try {
    const { prod_id, name, description, moq, productImage } = req.body;

    if (!req.session.reorderCart) req.session.reorderCart = [];

    req.session.reorderCart.push({
      prod_id,
      name,
      description,
      moq,
      productImage, // ✅ Include productImage
      message: ""
    });

    res.redirect('/userdashboard');
  } catch (err) {
    console.error("Error adding to reorder cart:", err);
    res.status(500).send("Failed to add to reorder cart");
  }
};

  
  
  export const viewReorderCart =async (req, res) => {
    try {
         const categories = await Category.find({ isDeleted: false });
            const productsByCategory = await Product.find().populate('catId');
        
            const categoryProductsMap = {};
            productsByCategory.forEach(product => {
              if (product.catId) {
                const categoryId = product.catId._id.toString();
                if (!categoryProductsMap[categoryId]) {
                  categoryProductsMap[categoryId] = [];
                }
                categoryProductsMap[categoryId].push(product);
              }
            });
      const reorderProducts = req.session.reorderCart || [];
      res.render('reorderCart', {  session: req.session, reorderProducts ,categories,categoryProductsMap});
    } catch (err) {
      console.error("Error viewing reorder cart:", err);
      res.status(500).send("Error");
    }
  };
  
  export const removeFromReorderCart = (req, res) => {
    const { prod_id } = req.body;
  
    req.session.reorderCart = (req.session.reorderCart || []).filter(p => p.prod_id !== prod_id);
  
    // Support fetch/JS redirect
    if (req.headers['content-type'] === 'application/json') {
      return res.redirect('/reorder-cart');
    }
  
    res.redirect('/reorder-cart');
  };
  
  export const submitReorder = async (req, res) => {
    try {
        const sessionUser = req.session.user;
        const user = await User.findById(sessionUser._id);
        
      
      const { products } = req.body;
  
      if (!products || products.length === 0) {
        return res.status(400).json({ success: false, message: "No products submitted" });
      }
  
      // 1. Generate LPO number
      let counter = await ReorderCounter.findOne();
      if (!counter) counter = await ReorderCounter.create({ count: 1000 });
      const lpoNumber = `LPO-${++counter.count}`;
      await counter.save();
  
      // 2. Save reorder without PDF path
      const reorder = await ReOrder.create({
        customerId: user._id,
        lpoNumber,
        products,
        pdfPath: "" // initially empty
      });
  
      // 3. Generate PDF
      const pdfUrl = await generateLpoPdf({
        from: user.name,
        to: "Superior Pack UAE",
        lpoNumber,
        date: new Date(),
        products
      });
  
      // 4. Update reorder with PDF URL
      await ReOrder.findByIdAndUpdate(reorder._id, { pdfPath: pdfUrl });
  
      // 5. Send email
      await sendReorderEmails({
        user,
        adminEmail: 'ashidhagithub@gmail.com',
        pdfPath: pdfUrl,
        lpoNumber
      });
  
      // 6. Clear cart
      req.session.reorderCart = [];
  
      res.json({ success: true, message: "Reorder submitted successfully" });
  
    } catch (err) {
      console.error("Reorder submit error:", err);
      res.status(500).json({ success: false, message: "Submission failed" });
    }
  };
  


export const generateLpoPdf = ({ from, to, lpoNumber, date, products }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(buffers);
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "raw", folder: "lpo-pdfs", public_id: lpoNumber },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      streamifier.createReadStream(pdfBuffer).pipe(stream);
    });

    const outerX = 40;
    const outerY = 40;
    const outerWidth = 520;
    const outerHeight = 720;

    const columnX = [50, 80, 200, 260, 320];
    const columnWidths = [25, 100, 50, 50, 210];

    let position;
    let currentPage = 1;

    const drawOuterBox = () => {
      doc.rect(outerX, outerY, outerWidth, outerHeight).stroke();
    };

    const drawHeader = () => {
      doc.fontSize(22).font("Helvetica-Bold").text("LPO", { align: "center" });
      doc.moveDown(1.5);

      const infoTop = doc.y;
      doc.fontSize(12).font("Helvetica");
      doc.text("From:", 50, infoTop).font("Helvetica-Bold").text(from, 120, infoTop).font("Helvetica");
      doc.text("To:", 50, infoTop + 20).font("Helvetica-Bold").text(to, 120, infoTop + 20).font("Helvetica");
      doc.text("LPO Number:", 340, infoTop).font("Helvetica-Bold").text(lpoNumber, 440, infoTop).font("Helvetica");
      doc.text("Date:", 340, infoTop + 20).font("Helvetica-Bold").text(new Date(date).toLocaleDateString(), 440, infoTop + 20).font("Helvetica");

      doc.moveDown(3);
    };

    const addTableHeader = () => {
      position = doc.y;
      doc.font("Helvetica-Bold");
      doc.text("No.", columnX[0], position, { width: columnWidths[0], align: 'left' });
      doc.text("Product Name", columnX[1], position, { width: columnWidths[1], align: 'left' });
      doc.text("Qty", columnX[2], position, { width: columnWidths[2], align: 'left' });
      doc.text("Image", columnX[3], position, { width: columnWidths[3], align: 'left' });
      doc.text("Description", columnX[4], position, { width: columnWidths[4], align: 'left' });

      doc.moveTo(outerX, position + 15).lineTo(outerX + outerWidth, position + 15).stroke();
      position += 25;
      doc.font("Helvetica");
    };

    const drawPageFooter = () => {
      doc.fontSize(9).fillColor("gray");
      doc.text("This document is auto-generated by Superior Pack UAE.", outerX, outerY + outerHeight - 30, {
        align: "center",
        width: outerWidth,
      });

      doc.fillColor("black").fontSize(10);
      doc.text(`Page ${currentPage}`, outerX + outerWidth - 50, outerY + outerHeight - 20);
      currentPage++;
    };

    drawOuterBox();
    drawHeader();
    addTableHeader();

    const loadImage = async (url) => {
      const response = await fetch(url);
      return await response.arrayBuffer();
    };

    const addRow = async (p, i) => {
      doc.font("Helvetica");

      const descriptionHeight = doc.heightOfString(p.message || "N/A", {
        width: columnWidths[4],
        align: 'left'
      });
      const rowHeight = Math.max(50, descriptionHeight + 10);

      if (position + rowHeight > outerY + outerHeight - 60) {
        drawPageFooter();
        doc.addPage();
        drawOuterBox();
        drawHeader();
        addTableHeader();
      }

      doc.text(i + 1, columnX[0], position, { width: columnWidths[0], align: 'left' });
      doc.text(p.name, columnX[1], position, { width: columnWidths[1], align: 'left' });
      doc.text(p.moq, columnX[2], position, { width: columnWidths[2], align: 'left' });

      if (p.productImage) {
        try {
          const imageBuffer = Buffer.from(await loadImage(p.productImage));
          doc.image(imageBuffer, columnX[3], position, { width: 40, height: 40 });
        } catch (err) {
          doc.text("Image error", columnX[3], position, { width: columnWidths[3] });
        }
      } else {
        doc.text("N/A", columnX[3], position, { width: columnWidths[3] });
      }

      doc.text(p.message || "N/A", columnX[4], position, { width: columnWidths[4], align: 'left' });

      position += rowHeight;

      // ✅ Draw only horizontal line for row
      doc.moveTo(outerX, position - 5).lineTo(outerX + outerWidth, position - 5).stroke();
    };

    (async () => {
      for (let i = 0; i < products.length; i++) {
        await addRow(products[i], i);
      }

      drawPageFooter();
      doc.end();
    })();
  });
};



  
  

export const sendReorderEmails = async ({ user, adminEmail, pdfPath, lpoNumber }) => {
  const transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const attachments = [{ filename: `${lpoNumber}.pdf`, path: pdfPath }];

  // Mail to Admin
  await transporter.sendMail({
    from: `"Superior Pack Orders" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `New Order Received - ${lpoNumber}`,
    text: `Dear Team,

A new order has been placed by the customer:

Name: ${user.name}
Email: ${user.email}

Please find the attached LPO (LPO Number: ${lpoNumber}) for your reference.

Best regards,  
Superior Pack UAE`,
    attachments
  });

  // Mail to Customer
  await transporter.sendMail({
    from: `"Superior Pack Orders" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `Your Order Confirmation - ${lpoNumber}`,
    text: `Dear ${user.name},

Thank you for placing your order with Superior Pack UAE.

We have received your order successfully, and it is now being processed.  
Please find your LPO (LPO Number: ${lpoNumber}) attached to this email for your records.

If you have any questions or need further assistance, feel free to reach out to us.

Best regards,  
Superior Pack UAE  
info@superiorpackuae.com`,
    attachments
  });
};


