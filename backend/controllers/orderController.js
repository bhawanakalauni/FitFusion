import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";

import razorpay from 'razorpay'

// global variables
const currency = 'inr'
const deliveryCharge = 50

// gateway initialize


const razorpayInstance = new razorpay({
    key_id : process.env.RAZORPAY_KEY_ID,
    key_secret : process.env.RAZORPAY_KEY_SECRET,
})

const decrementProductStock = async (productId, size, quantity) => {
    const product = await productModel.findById(productId);
    if (product) {
        let currentStock = product.stock;
        if (typeof currentStock !== 'object' || currentStock === null) {
            currentStock = {};
            for (const sz of product.sizes) {
                currentStock[sz] = sz === size ? Math.max(0, product.stock - quantity) : product.stock;
            }
        } else {
            const szStock = currentStock[size] !== undefined ? Number(currentStock[size]) : 0;
            currentStock[size] = Math.max(0, szStock - quantity);
        }
        product.stock = currentStock;
        product.markModified('stock');
        await product.save();
    }
}

// Placing orders using COD Method
const placeOrder = async (req,res) => {
    
    try {
        
        const { userId, items, amount, address} = req.body;

        // Check stock availability
        const outOfStockItems = [];
        for (const item of items) {
            const product = await productModel.findById(item._id);
            let stockVal = 0;
            if (product && product.stock) {
                if (typeof product.stock === 'object') {
                    stockVal = product.stock[item.size] !== undefined ? Number(product.stock[item.size]) : 0;
                } else if (typeof product.stock === 'number') {
                    stockVal = product.stock;
                }
            }
            if (!product || stockVal < item.quantity) {
                outOfStockItems.push({
                    _id: item._id,
                    name: product ? product.name : 'Unknown',
                    size: item.size,
                    requestedQuantity: item.quantity,
                    availableStock: stockVal
                });
            }
        }

        if (outOfStockItems.length > 0) {
            return res.json({
                success: false,
                reason: "OUT_OF_STOCK",
                outOfStockItems,
                message: `Insufficient stock for product: ${outOfStockItems[0].name}. Only ${outOfStockItems[0].availableStock} items left.`
            });
        }

        // Decrement stock
        for (const item of items) {
            await decrementProductStock(item._id, item.size, item.quantity);
        }

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod:"COD",
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        await userModel.findByIdAndUpdate(userId,{cartData:{}})

        res.json({success:true,message:"Order Placed"})


    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}



// Placing orders using Razorpay Method
const placeOrderRazorpay = async (req,res) => {
    try {
        
        const { userId, items, amount, address} = req.body

        // Check stock availability
        const outOfStockItems = [];
        for (const item of items) {
            const product = await productModel.findById(item._id);
            let stockVal = 0;
            if (product && product.stock) {
                if (typeof product.stock === 'object') {
                    stockVal = product.stock[item.size] !== undefined ? Number(product.stock[item.size]) : 0;
                } else if (typeof product.stock === 'number') {
                    stockVal = product.stock;
                }
            }
            if (!product || stockVal < item.quantity) {
                outOfStockItems.push({
                    _id: item._id,
                    name: product ? product.name : 'Unknown',
                    size: item.size,
                    requestedQuantity: item.quantity,
                    availableStock: stockVal
                });
            }
        }

        if (outOfStockItems.length > 0) {
            return res.json({
                success: false,
                reason: "OUT_OF_STOCK",
                outOfStockItems,
                message: `Insufficient stock for product: ${outOfStockItems[0].name}. Only ${outOfStockItems[0].availableStock} items left.`
            });
        }

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod:"Razorpay",
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const options = {
            amount: amount * 100,
            currency: currency.toUpperCase(),
            receipt : newOrder._id.toString()
        }

        await razorpayInstance.orders.create(options, (error,order)=>{
            if (error) {
                console.log(error)
                return res.json({success:false, message: error})
            }
            res.json({success:true,order})
        })

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

const verifyRazorpay = async (req,res) => {
    try {
        
        const { userId, razorpay_order_id  } = req.body

        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)
        if (orderInfo.status === 'paid') {
            const order = await orderModel.findById(orderInfo.receipt)
            if (order && !order.payment) {
                for (const item of order.items) {
                    await decrementProductStock(item._id, item.size, item.quantity);
                }
                await orderModel.findByIdAndUpdate(orderInfo.receipt,{payment:true});
                await userModel.findByIdAndUpdate(userId,{cartData:{}})
                res.json({ success: true, message: "Payment Successful" })
            } else if (order && order.payment) {
                res.json({ success: true, message: "Payment Already Processed" })
            } else {
                res.json({ success: false, message: "Order not found" })
            }
        } else {
             res.json({ success: false, message: 'Payment Failed' });
        }

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


const allOrders = async (req,res) => {

    try {
        const { page, limit } = req.body;
        if (page) {
            const p = parseInt(page) || 1;
            const l = parseInt(limit) || 10;
            const skip = (p - 1) * l;

            const total = await orderModel.countDocuments({ $or: [ { paymentMethod: 'COD' }, { payment: true } ] });
            const orders = await orderModel.find({ $or: [ { paymentMethod: 'COD' }, { payment: true } ] }).sort({ date: -1 }).skip(skip).limit(l);
            return res.json({ success: true, orders, total, page: p, pages: Math.ceil(total / l) });
        }
        
        const orders = await orderModel.find({ $or: [ { paymentMethod: 'COD' }, { payment: true } ] }).sort({ date: -1 })
        res.json({success:true,orders})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

const userOrders = async (req,res) => {
    try {
        
        const { userId, page, limit } = req.body

        if (page) {
            const p = parseInt(page) || 1;
            const l = parseInt(limit) || 10;
            const skip = (p - 1) * l;

            const filter = { userId, $or: [ { paymentMethod: 'COD' }, { payment: true } ] };
            const total = await orderModel.countDocuments(filter);
            const orders = await orderModel.find(filter).sort({ date: -1 }).skip(skip).limit(l);
            return res.json({ success: true, orders, total, page: p, pages: Math.ceil(total / l) });
        }

        const orders = await orderModel.find({ userId, $or: [ { paymentMethod: 'COD' }, { payment: true } ] }).sort({ date: -1 })
        res.json({success:true,orders})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// update order status from Admin Panel
const updateStatus = async (req,res) => {
    try {
        
        const { orderId, status } = req.body

        await orderModel.findByIdAndUpdate(orderId, { status })
        res.json({success:true,message:'Status Updated'})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

export {verifyRazorpay, placeOrder, placeOrderRazorpay, allOrders, userOrders, updateStatus}