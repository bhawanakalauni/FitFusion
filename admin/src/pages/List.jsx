import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const List = ({ token }) => {

  const navigate = useNavigate();
  const [list, setList] = useState([])
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchList = async (pageNum = 1, append = false) => {
    if (fetching) return;
    setFetching(true);
    try {

      const response = await axios.get(backendUrl + `/api/product/list?page=${pageNum}&limit=10`)
      if (response.data.success) {
        if (append) {
          setList(prev => [...prev, ...response.data.products]);
        } else {
          setList(response.data.products);
        }
        setPage(response.data.page);
        setHasMore(response.data.page < response.data.pages);
      }
      else {
        toast.error(response.data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setFetching(false);
    }
  }

  const removeProduct = async (id) => {
    if (deletingIds.has(id)) return;
    setDeletingIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    try {

      const response = await axios.post(backendUrl + '/api/product/remove', { id }, { headers: { token } })

      if (response.data.success) {
        toast.success(response.data.message)
        await fetchList(1, false);
      } else {
        toast.error(response.data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  useEffect(() => {
    fetchList(1, false)
  }, [])

  return (
    <>
      <p className='mb-2'>All Products List</p>
      <div className='flex flex-col gap-2'>

        {/* ------- List Table Title ---------- */}

        <div className='hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm'>
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Stock</b>
          <b className='text-center'>Action</b>
        </div>

        {/* ------ Product List ------ */}

        {
          list.map((item, index) => (
            <div className='grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[1fr_3fr_1fr_1fr_1fr_1fr] items-center gap-2 py-1 px-2 border text-sm' key={index}>
              <img className='w-12' src={item.image[0]} alt="" />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>{currency}{item.price}</p>
              <p>
                {(() => {
                  if (item.stock === undefined || item.stock === null) return "0";
                  if (typeof item.stock === 'object') {
                    const parts = [];
                    for (const key in item.stock) {
                      parts.push(`${key}: ${item.stock[key]}`);
                    }
                    return parts.length > 0 ? parts.join(', ') : "No Sizes";
                  }
                  return item.stock;
                })()}
              </p>
              <div className='flex gap-3 justify-end md:justify-center items-center'>
                <span 
                  onClick={() => navigate(`/edit/${item._id}`)} 
                  className='cursor-pointer text-blue-500 hover:text-blue-700 font-medium'
                >
                  Edit
                </span>
                <span 
                  onClick={() => !deletingIds.has(item._id) && removeProduct(item._id)} 
                  className={`cursor-pointer text-lg font-bold ${deletingIds.has(item._id) ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  X
                </span>
              </div>
            </div>
          ))
        }

      </div>

      {hasMore && (
        <div className='flex justify-center mt-6'>
          <button 
            type="button"
            onClick={() => fetchList(page + 1, true)} 
            disabled={fetching}
            className='bg-black text-white text-xs font-semibold py-3 px-8 hover:bg-gray-800 disabled:opacity-50 transition rounded-sm cursor-pointer'
          >
            {fetching ? 'LOADING...' : 'LOAD MORE'}
          </button>
        </div>
      )}
    </>
  )
}

export default List