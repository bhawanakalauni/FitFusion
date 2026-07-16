import { v2 as cloudinary } from "cloudinary"
import productModel from "../models/productModel.js"

// function for add product
const addProduct = async (req, res) => {
    try {

        const { name, description, price, category, subCategory, sizes, bestseller, stock } = req.body

        const image1 = req.files.image1 && req.files.image1[0]
        const image2 = req.files.image2 && req.files.image2[0]
        const image3 = req.files.image3 && req.files.image3[0]
        const image4 = req.files.image4 && req.files.image4[0]

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined)

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                return result.secure_url
            })
        )

        const productData = {
            name,
            description,
            category,
            price: Math.max(0, Number(price)),
            subCategory,
            bestseller: bestseller === "true" ? true : false,
            sizes: JSON.parse(sizes),
            image: imagesUrl,
            stock: (() => {
                try {
                    const parsedStock = typeof stock === 'string' ? JSON.parse(stock) : (stock || {});
                    const cleanedStock = {};
                    for (const size in parsedStock) {
                        cleanedStock[size] = Math.max(0, Math.floor(Number(parsedStock[size]))) || 0;
                    }
                    return cleanedStock;
                } catch (e) {
                    return {};
                }
            })(),
            date: Date.now()
        }

        console.log(productData);

        const product = new productModel(productData);
        await product.save()

        res.json({ success: true, message: "Product Added" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for list product
const listProducts = async (req, res) => {
    try {
        if (req.query.page) {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const total = await productModel.countDocuments({});
            const products = await productModel.find({}).sort({ date: -1 }).skip(skip).limit(limit);
            return res.json({ success: true, products, total, page, pages: Math.ceil(total / limit) });
        }
        
        const products = await productModel.find({});
        res.json({success:true,products})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for removing product
const removeProduct = async (req, res) => {
    try {
        
        await productModel.findByIdAndDelete(req.body.id)
        res.json({success:true,message:"Product Removed"})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for single product info
const singleProduct = async (req, res) => {
    try {
        
        const { productId } = req.body
        const product = await productModel.findById(productId)
        res.json({success:true,product})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for editing product
const updateProduct = async (req, res) => {
    try {
        const { id, name, description, price, category, subCategory, sizes, bestseller, stock, existingImages } = req.body

        const slots = JSON.parse(existingImages)

        // Upload new images to their respective slots if provided
        if (req.files) {
            if (req.files.image1 && req.files.image1[0]) {
                const result = await cloudinary.uploader.upload(req.files.image1[0].path, { resource_type: 'image' });
                slots[0] = result.secure_url;
            }
            if (req.files.image2 && req.files.image2[0]) {
                const result = await cloudinary.uploader.upload(req.files.image2[0].path, { resource_type: 'image' });
                slots[1] = result.secure_url;
            }
            if (req.files.image3 && req.files.image3[0]) {
                const result = await cloudinary.uploader.upload(req.files.image3[0].path, { resource_type: 'image' });
                slots[2] = result.secure_url;
            }
            if (req.files.image4 && req.files.image4[0]) {
                const result = await cloudinary.uploader.upload(req.files.image4[0].path, { resource_type: 'image' });
                slots[3] = result.secure_url;
            }
        }

        const finalImages = slots.filter(img => img !== null && img !== undefined && img !== '');

        const updatedData = {
            name,
            description,
            category,
            price: Math.max(0, Number(price)),
            subCategory,
            bestseller: bestseller === "true" ? true : false,
            sizes: JSON.parse(sizes),
            image: finalImages,
            stock: (() => {
                try {
                    const parsedStock = typeof stock === 'string' ? JSON.parse(stock) : (stock || {});
                    const cleanedStock = {};
                    for (const size in parsedStock) {
                        cleanedStock[size] = Math.max(0, Math.floor(Number(parsedStock[size]))) || 0;
                    }
                    return cleanedStock;
                } catch (e) {
                    return {};
                }
            })()
        }

        await productModel.findByIdAndUpdate(id, updatedData)

        res.json({ success: true, message: "Product Updated" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { listProducts, addProduct, removeProduct, singleProduct, updateProduct }