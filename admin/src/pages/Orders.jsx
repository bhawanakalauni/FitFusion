import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const Orders = ({ token }) => {

  const [orders, setOrders] = useState([])
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchAllOrders = async (pageNum = 1, append = false) => {

    if (!token) {
      return null;
    }
    if (fetching) return;
    setFetching(true);

    try {

      const response = await axios.post(backendUrl + '/api/order/list', { page: pageNum, limit: 10 }, { headers: { token } })
      if (response.data.success) {
        if (append) {
          setOrders(prev => [...prev, ...response.data.orders]);
        } else {
          setOrders(response.data.orders);
        }
        setPage(response.data.page);
        setHasMore(response.data.page < response.data.pages);
      } else {
        toast.error(response.data.message)
      }

    } catch (error) {
      toast.error(error.message)
    } finally {
      setFetching(false);
    }
  }

  const statusHandler = async ( event, orderId ) => {
    if (updatingIds.has(orderId)) return;
    setUpdatingIds(prev => {
      const next = new Set(prev);
      next.add(orderId);
      return next;
    });
    try {
      const response = await axios.post(backendUrl + '/api/order/status' , {orderId, status:event.target.value}, { headers: {token}})
      if (response.data.success) {
        await fetchAllOrders(1, false)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  }

  useEffect(() => {
    fetchAllOrders(1, false);
  }, [token])

  return (
    <div>
      <h3>Order Page</h3>
      <div>
        {
          orders.map((order, index) => (
            <div className='grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 border-gray-200 p-5 md:p-8 my-3 md:my-4 text-xs sm:text-sm text-gray-700' key={index}>
              <img className='w-12' src={assets.parcel_icon} alt="" />
              <div>
                <div>
                  {order.items.map((item, index) => {
                    if (index === order.items.length - 1) {
                      return <p className='py-0.5' key={index}> {item.name} x {item.quantity} <span> {item.size} </span> </p>
                    }
                    else {
                      return <p className='py-0.5' key={index}> {item.name} x {item.quantity} <span> {item.size} </span> ,</p>
                    }
                  })}
                </div>
                <p className='mt-3 mb-2 font-medium'>{order.address.name || (order.address.firstName + " " + (order.address.lastName || ''))}</p>
                <div>
                  <p>{order.address.street + ","}</p>
                  <p>{order.address.city + ", " + order.address.state + ", " + order.address.country + ", " + order.address.zipcode}</p>
                </div>
                <p>{order.address.phone}</p>
              </div>
              <div>
                <p className='text-sm sm:text-[15px]'>Items : {order.items.length}</p>
                <p className='mt-3'>Method : {order.paymentMethod}</p>
                <p>Payment : { order.payment ? 'Done' : 'Pending' }</p>
                <p>Date : {new Date(order.date).toLocaleDateString()}</p>
              </div>
              <p className='text-sm sm:text-[15px]'>{currency}{order.amount}</p>
              <select 
                onChange={(event)=>statusHandler(event,order._id)} 
                value={order.status} 
                disabled={updatingIds.has(order._id)}
                className={`p-2 font-semibold ${updatingIds.has(order._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="Order Placed">Order Placed</option>
                <option value="Packing">Packing</option>
                <option value="Shipped">Shipped</option>
                <option value="Out for delivery">Out for delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          ))
        }
      </div>

      {hasMore && (
        <div className='flex justify-center mt-6'>
          <button 
            type="button"
            onClick={() => fetchAllOrders(page + 1, true)} 
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