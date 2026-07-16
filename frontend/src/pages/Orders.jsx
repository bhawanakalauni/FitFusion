import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';
import axios from 'axios';

const Orders = () => {

  const { backendUrl, token , currency, navigate} = useContext(ShopContext);

  const [orderData,setorderData] = useState([])
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [fetching, setFetching] = useState(false);

  const loadOrderData = async (pageNum = 1, append = false) => {
    if (!token) return;
    if (fetching) return;
    setFetching(true);
    try {
      const response = await axios.post(backendUrl + '/api/order/userorders', { page: pageNum, limit: 5 }, { headers: { token } })
      if (response.data.success) {
        if (append) {
          setorderData(prev => [...prev, ...response.data.orders]);
        } else {
          setorderData(response.data.orders);
        }
        setPage(response.data.page);
        setHasMore(response.data.page < response.data.pages);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (!token) {
      navigate('/login')
    } else {
      loadOrderData(1, false)
    }
  },[token])

  return (
    <div className='border-t pt-16'>

        <div className='text-2xl'>
            <Title text1={'MY'} text2={'ORDERS'}/>
        </div>

        <div>
            {
              orderData.map((order, index) => (
                <div key={index} className='py-6 border-t border-b text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-6'>
                    <div className='flex flex-col gap-4 flex-1'>
                        {order.items.map((item, itemIndex) => (
                          <div key={itemIndex} className='flex items-start gap-6 text-sm'>
                              <img className='w-16 sm:w-20 rounded border bg-slate-50' src={item.image[0]} alt="" />
                              <div className='flex-1'>
                                <p className='sm:text-base font-semibold text-gray-800'>{item.name}</p>
                                <div className='flex flex-wrap items-center gap-3 mt-1 text-base text-gray-600'>
                                  <p>{currency}{item.price}</p>
                                  <p>Quantity: <span className='font-medium text-black'>{item.quantity}</span></p>
                                  <p>Size: <span className='px-2 py-0.5 border bg-slate-50 rounded text-xs'>{item.size}</span></p>
                                </div>
                              </div>
                          </div>
                        ))}
                        <div className='mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400 border-t pt-2 max-w-xl'>
                          <p>Order ID: <span className='font-mono text-gray-600'>{order._id}</span></p>
                          <p>Date: <span className='font-medium text-gray-600'>{new Date(order.date).toDateString()}</span></p>
                          <p>Payment: <span className='font-medium text-gray-600'>{order.paymentMethod} ({order.payment ? 'Paid' : 'Pending'})</span></p>
                        </div>
                    </div>
                    <div className='md:w-1/3 flex justify-between items-center gap-4 md:border-l md:pl-6 border-t md:border-t-0 pt-4 md:pt-0'>
                        <div className='flex items-center gap-2'>
                            <p className='min-w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse'></p>
                            <p className='text-sm md:text-base font-medium text-gray-800'>{order.status}</p>
                        </div>
                        <button onClick={() => loadOrderData(1, false)} className='border border-gray-300 hover:bg-gray-50 transition px-4 py-2 text-sm font-semibold rounded-sm shadow-sm'>Track Order</button>
                    </div>
                </div>
              ))
            }
        </div>

        {hasMore && (
          <div className='flex justify-center mt-8'>
            <button 
              type="button"
              onClick={() => loadOrderData(page + 1, true)} 
              disabled={fetching}
              className='bg-black text-white text-xs font-semibold py-3 px-8 hover:bg-gray-800 disabled:opacity-50 transition rounded-sm cursor-pointer'
            >
              {fetching ? 'LOADING...' : 'LOAD MORE'}
            </button>
          </div>
        )}
    </div>
  )
}

export default Orders
