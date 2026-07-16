import React, { useContext, useEffect, useState } from 'react'
import Title from '../components/Title'
import CartTotal from '../components/CartTotal'
import { assets } from '../assets/assets'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const PlaceOrder = () => {

    const [method, setMethod] = useState('razorpay');
    const [loading, setLoading] = useState(false);
    const { navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, delivery_fee, products, getProductsData, getStockForSize, setStockErrors } = useContext(ShopContext);

    useEffect(() => {
        if (!token) {
            navigate('/login');
        }
    }, [token]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        street: '',
        city: '',
        state: '',
        zipcode: '',
        country: '',
        phone: ''
    })

    const fetchUserProfileAndAddress = async () => {
        try {
            if (!token) return;

            let accName = '';
            let accEmail = '';

            // Fetch user profile
            const profileRes = await axios.get(backendUrl + '/api/user/profile', { headers: { token } });
            if (profileRes.data.success && profileRes.data.user) {
                accName = profileRes.data.user.name || '';
                accEmail = profileRes.data.user.email || '';
                
                setFormData(prev => ({
                    ...prev,
                    name: accName,
                    email: accEmail
                }));
            }

            // Fetch latest order address details
            const ordersRes = await axios.post(backendUrl + '/api/order/userorders', {}, { headers: { token } });
            if (ordersRes.data.success && ordersRes.data.orders.length > 0) {
                const sortedOrders = ordersRes.data.orders.sort((a, b) => b.date - a.date);
                const latestOrder = sortedOrders[0];
                if (latestOrder && latestOrder.address) {
                    setFormData({
                        name: accName || latestOrder.address.name || latestOrder.address.firstName || '',
                        email: accEmail || latestOrder.address.email || '',
                        street: latestOrder.address.street || '',
                        city: latestOrder.address.city || '',
                        state: latestOrder.address.state || '',
                        zipcode: latestOrder.address.zipcode || '',
                        country: latestOrder.address.country || '',
                        phone: latestOrder.address.phone || ''
                    });
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        if (token) {
            fetchUserProfileAndAddress();
        }
    }, [token]);

    const onChangeHandler = (event) => {
        const name = event.target.name
        const value = event.target.value
        setFormData(data => ({ ...data, [name]: value }))
    }

    const initPay = (order) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name:'Order Payment',
            description:'Order Payment',
            order_id: order.id,
            receipt: order.receipt,
            handler: async (response) => {
                console.log(response)
                try {
                    
                    const { data } = await axios.post(backendUrl + '/api/order/verifyRazorpay',response,{headers:{token}})
                    if (data.success) {
                        navigate('/orders')
                        setCartItems({})
                        getProductsData()
                    }
                } catch (error) {
                    console.log(error)
                    toast.error(error)
                }
            }
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault()
        if (loading) return
        setLoading(true)
        try {

            let orderItems = []

            for (const items in cartItems) {
                for (const item in cartItems[items]) {
                    if (cartItems[items][item] > 0) {
                        const itemInfo = structuredClone(products.find(product => product._id === items))
                        if (itemInfo) {
                            itemInfo.size = item
                            itemInfo.quantity = cartItems[items][item]
                            orderItems.push(itemInfo)
                        }
                    }
                }
            }

            // Client side stock check before initiating checkout
            for (const itemInfo of orderItems) {
                const product = products.find(p => p._id === itemInfo._id);
                if (!product) {
                    toast.error("One of the products in your cart is no longer available.");
                    setLoading(false);
                    return;
                }
                const stock = getStockForSize(product, itemInfo.size);
                if (stock < itemInfo.quantity) {
                    toast.error(`Insufficient stock for product: ${product.name} (size ${itemInfo.size}). Only ${stock} items left.`);
                    setLoading(false);
                    return;
                }
            }

            let orderData = {
                address: formData,
                items: orderItems,
                amount: getCartAmount() + delivery_fee
            }
            

            const responseRazorpay = await axios.post(backendUrl + '/api/order/razorpay', orderData, {headers:{token}})
            if (responseRazorpay.data.success) {
                initPay(responseRazorpay.data.order)
            } else {
                if (responseRazorpay.data.reason === 'OUT_OF_STOCK') {
                    toast.error("Some items are out of stock. Redirecting to cart...");
                    setStockErrors(responseRazorpay.data.outOfStockItems);
                    setTimeout(() => {
                        navigate('/cart');
                    }, 1500);
                } else {
                    toast.error(responseRazorpay.data.message);
                }
            }


        } catch (error) {
            console.log(error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }


    return (
        <form onSubmit={onSubmitHandler} className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t'>
            {/* ------------- Left Side ---------------- */}
            <div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>

                <div className='text-xl sm:text-2xl my-3'>
                    <Title text1={'DELIVERY'} text2={'INFORMATION'} />
                </div>
                <input required readOnly name='name' value={formData.name} className='border border-gray-300 rounded py-1.5 px-3.5 w-full bg-gray-100 cursor-not-allowed text-gray-500' type="text" placeholder='Full name' />
                <input required readOnly name='email' value={formData.email} className='border border-gray-300 rounded py-1.5 px-3.5 w-full bg-gray-100 cursor-not-allowed text-gray-500' type="email" placeholder='Email address' />
                <input required onChange={onChangeHandler} name='street' value={formData.street} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Street' />
                <div className='flex gap-3'>
                    <input required onChange={onChangeHandler} name='city' value={formData.city} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='City' />
                    <input onChange={onChangeHandler} name='state' value={formData.state} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='State' />
                </div>
                <div className='flex gap-3'>
                    <input required onChange={onChangeHandler} name='zipcode' value={formData.zipcode} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="number" placeholder='Zipcode' />
                    <input required onChange={onChangeHandler} name='country' value={formData.country} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Country' />
                </div>
                <input required onChange={onChangeHandler} name='phone' value={formData.phone} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="number" placeholder='Phone' />
            </div>

            {/* ------------- Right Side ------------------ */}
            <div className='mt-8'>

                <div className='mt-8 min-w-80'>
                    <CartTotal />
                </div>

                <div className='mt-12'>
                    <Title text1={'PAYMENT'} text2={'METHOD'} />
                    {/* --------------- Payment Method Selection ------------- */}
                    <div className='flex gap-3 flex-col lg:flex-row'>
                        <div className='flex items-center gap-3 border p-2 px-3 border-orange-500 bg-orange-50/10 rounded'>
                            <p className='min-w-3.5 h-3.5 border rounded-full bg-green-400'></p>
                            <img className='h-5 mx-4' src={assets.razorpay_logo} alt="Razorpay" />
                        </div>
                    </div>

                    <div className='w-full flex justify-center mt-8'>
                        <button 
                            type='submit' 
                            disabled={loading} 
                            className='bg-black text-white px-16 py-3 text-sm disabled:opacity-50 inline-flex items-center gap-2 justify-center'
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    PLACING ORDER...
                                </>
                            ) : 'PLACE ORDER'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    )
}

export default PlaceOrder
