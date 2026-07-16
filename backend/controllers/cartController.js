import userModel from "../models/userModel.js"
import productModel from "../models/productModel.js"


// add products to user cart
const addToCart = async (req,res) => {
    try {
        
        const { userId, itemId, size } = req.body

        const product = await productModel.findById(itemId);
        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }

        const userData = await userModel.findById(userId)
        let cartData = await userData.cartData;

        let currentQty = 0;
        if (cartData[itemId] && cartData[itemId][size]) {
            currentQty = cartData[itemId][size];
        }

        let stockVal = 0;
        if (product.stock) {
            if (typeof product.stock === 'object') {
                stockVal = product.stock[size] !== undefined ? Number(product.stock[size]) : 0;
            } else if (typeof product.stock === 'number') {
                stockVal = product.stock;
            }
        }

        if (currentQty + 1 > stockVal) {
            return res.json({ success: false, message: `Only ${stockVal} items available in stock` });
        }

        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += 1
            }
            else {
                cartData[itemId][size] = 1
            }
        } else {
            cartData[itemId] = {}
            cartData[itemId][size] = 1
        }

        await userModel.findByIdAndUpdate(userId, {cartData})

        res.json({ success: true, message: "Added To Cart" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// update user cart
const updateCart = async (req,res) => {
    try {
        
        const { userId ,itemId, size, quantity } = req.body

        if (quantity > 0) {
            const product = await productModel.findById(itemId);
            if (!product) {
                return res.json({ success: false, message: "Product not found" });
            }
            let stockVal = 0;
            if (product.stock) {
                if (typeof product.stock === 'object') {
                    stockVal = product.stock[size] !== undefined ? Number(product.stock[size]) : 0;
                } else if (typeof product.stock === 'number') {
                    stockVal = product.stock;
                }
            }
            if (quantity > stockVal) {
                return res.json({ success: false, message: `Only ${stockVal} items available in stock` });
            }
        }

        const userData = await userModel.findById(userId)
        let cartData = await userData.cartData;

        cartData[itemId][size] = quantity

        await userModel.findByIdAndUpdate(userId, {cartData})
        res.json({ success: true, message: "Cart Updated" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


// get user cart data
const getUserCart = async (req,res) => {

    try {
        
        const { userId } = req.body
        
        const userData = await userModel.findById(userId)
        let cartData = await userData.cartData;

        res.json({ success: true, cartData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

export { addToCart, updateCart, getUserCart }