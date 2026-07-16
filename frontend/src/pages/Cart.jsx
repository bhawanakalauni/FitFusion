import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';
import { assets } from '../assets/assets';
import CartTotal from '../components/CartTotal';
import { toast } from 'react-toastify';

const Cart = () => {

  const { products, currency, cartItems, updateQuantity, navigate, token, getStockForSize, stockErrors, setStockErrors } = useContext(ShopContext);

  const [cartData, setCartData] = useState([]);

  useEffect(() => {

    if (products.length > 0) {
      const tempData = [];
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            tempData.push({
              _id: items,
              size: item,
              quantity: cartItems[items][item]
            })
          }
        }
      }
      setCartData(tempData);
    }
  }, [cartItems, products])

  const [loading, setLoading] = useState(false);

  const handleProceedToCheckout = () => {
    if (!token) {
      toast.info("Please login to proceed to checkout");
      navigate('/login');
      return;
    }

    // Verify stock levels before proceeding
    for (const item of cartData) {
      const product = products.find(p => p._id === item._id);
      if (!product) {
        toast.error("One of the products in your cart is no longer available.");
        return;
      }
      const stock = getStockForSize(product, item.size);
      if (stock < item.quantity) {
        toast.error(`Insufficient stock for product: ${product.name} (size ${item.size}). Only ${stock} items left.`);
        return;
      }
    }

    setLoading(true);
    setTimeout(() => {
      navigate('/place-order');
    }, 600);
  }

  const handleQuantityChange = (itemId, size, valueStr) => {
    const qty = Math.floor(Number(valueStr));
    if (isNaN(qty) || qty < 1) return;
    updateQuantity(itemId, size, qty);

    setStockErrors(prev => {
      const matchingErr = prev.find(err => err._id === itemId && err.size === size);
      if (matchingErr && qty <= matchingErr.availableStock) {
        return prev.filter(err => !(err._id === itemId && err.size === size));
      }
      return prev;
    });
  }

  const handleBlur = (e, itemId, size, currentQty) => {
    const qty = Math.floor(Number(e.target.value));
    if (e.target.value === '' || isNaN(qty) || qty < 1) {
      e.target.value = currentQty;
    }
  }

  return (
    <div className='border-t pt-14'>

      <div className=' text-2xl mb-3'>
        <Title text1={'YOUR'} text2={'CART'} />
      </div>

      {cartData.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-20 gap-4 text-center'>
          <img src={assets.cart_icon} className='w-16 opacity-30' alt="" />
          <h2 className='text-xl font-semibold text-gray-700'>Your Cart is Empty</h2>
          <p className='text-sm text-gray-400 max-w-sm'>Looks like you haven't added any products to your cart yet. Explore our latest collections to find something you love!</p>
          <button 
            onClick={() => navigate('/collection')} 
            className='bg-black text-white text-xs font-semibold py-3 px-8 hover:bg-gray-800 transition mt-2 rounded-sm'
          >
            SHOP NOW
          </button>
        </div>
      ) : (
        <>
          <div>
            {
              cartData.map((item, index) => {

                const productData = products.find((product) => product._id === item._id);

                return (
                  <div key={index} className='py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4'>
                    <div className=' flex items-start gap-6'>
                      <img className='w-16 sm:w-20' src={productData.image[0]} alt="" />
                      <div>
                        <p className='text-xs sm:text-lg font-medium'>{productData.name}</p>
                        <div className='flex items-center gap-5 mt-2'>
                          <p>{currency}{productData.price}</p>
                          <p className='px-2 sm:px-3 sm:py-1 border bg-slate-50'>{item.size}</p>
                        </div>
                        {(() => {
                          const errorItem = stockErrors.find(err => err._id === item._id && err.size === item.size);
                          return errorItem ? (
                            <p className="text-red-500 text-xs mt-2 font-semibold animate-pulse">
                              Please decrease this quantity to {errorItem.availableStock} to successfully order
                            </p>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <input 
                      onChange={(e) => handleQuantityChange(item._id, item.size, e.target.value)} 
                      onBlur={(e) => handleBlur(e, item._id, item.size, item.quantity)}
                      className='border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1' 
                      type="number" 
                      min={1} 
                      step={1} 
                      value={item.quantity} 
                    />
                    <img onClick={() => updateQuantity(item._id, item.size, 0)} className='w-4 mr-4 sm:w-5 cursor-pointer' src={assets.bin_icon} alt="" />
                  </div>
                )

              })
            }
          </div>

          <div className='flex justify-end my-20'>
            <div className='w-full sm:w-[450px]'>
              <CartTotal />
              <div className=' w-full text-end'>
                <button 
                  onClick={handleProceedToCheckout} 
                  disabled={loading} 
                  className='bg-black text-white text-sm my-8 px-8 py-3 disabled:opacity-50 inline-flex items-center gap-2 justify-center'
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      PROCESSING...
                    </>
                  ) : 'PROCEED TO CHECKOUT'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Cart
