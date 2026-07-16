import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from 'axios'

export const ShopContext = createContext();

const ShopContextProvider = (props) => {

    const currency = '₹ ';
    const delivery_fee = 50;
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems, setCartItems] = useState(() => {
        try {
            const localCart = localStorage.getItem('cartItems');
            return localCart ? JSON.parse(localCart) : {};
        } catch (error) {
            return {};
        }
    });
    const [products, setProducts] = useState([]);
    const [token, setToken] = useState(() => localStorage.getItem('token') || '')
    const [stockErrors, setStockErrors] = useState([])
    const navigate = useNavigate();


    const getStockForSize = (product, size) => {
        if (!product || !product.stock) return 0;
        if (typeof product.stock === 'object') {
            return product.stock[size] !== undefined ? Number(product.stock[size]) : 0;
        } else if (typeof product.stock === 'number') {
            return product.stock;
        }
        return 0;
    }


    const addToCart = async (itemId, size) => {

        if (!size) {
            toast.error('Select Product Size');
            return;
        }

        const product = products.find((item) => item._id === itemId);
        const stock = getStockForSize(product, size);
        const currentQty = (cartItems[itemId] && cartItems[itemId][size]) ? cartItems[itemId][size] : 0;

        if (currentQty + 1 > stock) {
            toast.error(`Only ${stock} items available in stock`);
            return;
        }

        let cartData = structuredClone(cartItems);

        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += 1;
            }
            else {
                cartData[itemId][size] = 1;
            }
        }
        else {
            cartData[itemId] = {};
            cartData[itemId][size] = 1;
        }
        setCartItems(cartData);

        if (token) {
            try {

                const response = await axios.post(backendUrl + '/api/cart/add', { itemId, size }, { headers: { token } })
                if (!response.data.success) {
                    toast.error(response.data.message);
                }

            } catch (error) {
                console.log(error)
                toast.error(error.message)
            }
        }

    }

    const getCartCount = () => {
        let totalCount = 0;
        for (const items in cartItems) {
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        totalCount += cartItems[items][item];
                    }
                } catch (error) {

                }
            }
        }
        return totalCount;
    }

    const updateQuantity = async (itemId, size, quantity) => {

        let finalQuantity = quantity;
        if (quantity > 0) {
            const product = products.find((item) => item._id === itemId);
            const stock = getStockForSize(product, size);
            if (quantity > stock) {
                toast.error(`Only ${stock} items available in stock`);
                finalQuantity = stock;
            }
        }

        let cartData = structuredClone(cartItems);

        cartData[itemId][size] = finalQuantity;

        setCartItems(cartData)

        if (token) {
            try {

                const response = await axios.post(backendUrl + '/api/cart/update', { itemId, size, quantity: finalQuantity }, { headers: { token } })
                if (!response.data.success) {
                    toast.error(response.data.message);
                }

            } catch (error) {
                console.log(error)
                toast.error(error.message)
            }
        }

    }

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        totalAmount += itemInfo.price * cartItems[items][item];
                    }
                } catch (error) {

                }
            }
        }
        return totalAmount;
    }

    const getProductsData = async () => {
        try {

            const response = await axios.get(backendUrl + '/api/product/list')
            if (response.data.success) {
                setProducts(response.data.products.reverse())
            } else {
                toast.error(response.data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const getUserCart = async ( token ) => {
        try {
            
            const response = await axios.post(backendUrl + '/api/cart/get',{},{headers:{token}})
            if (response.data.success) {
                const dbCart = response.data.cartData || {};
                let localCart = {};
                try {
                    const localCartStr = localStorage.getItem('cartItems');
                    if (localCartStr) {
                        localCart = JSON.parse(localCartStr);
                    }
                } catch (e) {
                    console.log("Error parsing local cart", e);
                }

                // Merge dbCart and localCart
                const mergedCart = structuredClone(dbCart);
                for (const itemId in localCart) {
                    if (!mergedCart[itemId]) {
                        mergedCart[itemId] = {};
                    }
                    for (const size in localCart[itemId]) {
                        const dbQty = mergedCart[itemId][size] || 0;
                        const localQty = localCart[itemId][size] || 0;
                        const product = products.find((p) => p._id === itemId);
                        const stock = product ? getStockForSize(product, size) : Infinity;
                        mergedCart[itemId][size] = Math.min(dbQty + localQty, stock);
                    }
                }

                setCartItems(mergedCart)

                // Sync merged quantities from mergedCart back to database
                for (const itemId in localCart) {
                    for (const size in localCart[itemId]) {
                        const mergedQty = mergedCart[itemId][size];
                        const dbQty = dbCart[itemId]?.[size] || 0;
                        if (mergedQty > dbQty) {
                            await axios.post(backendUrl + '/api/cart/update', { itemId, size, quantity: mergedQty }, { headers: { token } })
                        }
                    }
                }

                // Clear guest cart from local storage since it's merged and synchronized
                localStorage.removeItem('cartItems');
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    useEffect(() => {
        getProductsData()
    }, [])

    useEffect(() => {
        if (!token && localStorage.getItem('token')) {
            setToken(localStorage.getItem('token'))
            getUserCart(localStorage.getItem('token'))
        }
        if (token) {
            getUserCart(token)
        }
    }, [token])

    useEffect(() => {
        if (!token) {
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
        }
    }, [cartItems, token])

    const value = {
        products, currency, delivery_fee,
        search, setSearch, showSearch, setShowSearch,
        cartItems, addToCart,setCartItems,
        getCartCount, updateQuantity,
        getCartAmount, navigate, backendUrl,
        setToken, token, getProductsData, getStockForSize,
        stockErrors, setStockErrors
    }

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    )

}

export default ShopContextProvider;