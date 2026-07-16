import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import RelatedProducts from '../components/RelatedProducts';
import axios from 'axios';
import { toast } from 'react-toastify';

const Product = () => {

  const { productId } = useParams();
  const { products, currency ,addToCart, cartItems, updateQuantity, backendUrl, token, navigate, getStockForSize } = useContext(ShopContext);
  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState('')
  const [size,setSize] = useState('')
  const [loading, setLoading] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [eligible, setEligible] = useState(false);
  const [eligibleMessage, setEligibleMessage] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdded = size && cartItems[productData._id] && cartItems[productData._id][size] > 0;
  const currentQty = (size && cartItems[productData._id] && cartItems[productData._id][size]) ? cartItems[productData._id][size] : 0;

  const getActiveStock = () => {
    if (!productData) return 0;
    if (size) {
      return getStockForSize(productData, size);
    }
    if (typeof productData.stock === 'object' && productData.stock !== null) {
      let total = 0;
      for (const key in productData.stock) {
        total += Number(productData.stock[key]) || 0;
      }
      return total;
    }
    return Number(productData.stock) || 0;
  }
  const activeStock = getActiveStock();

  const handleAddToCart = async () => {
    if (loading) return;
    if (!size) {
      addToCart(productData._id, size);
      return;
    }
    setLoading(true);
    await addToCart(productData._id, size);
    setLoading(false);
  }

  const handleRemoveFromCart = async () => {
    if (loading) return;
    if (!size) return;
    setLoading(true);
    await updateQuantity(productData._id, size, 0);
    setLoading(false);
  }

  const handleButtonClick = async () => {
    if (isAdded) {
      await handleRemoveFromCart();
    } else {
      await handleAddToCart();
    }
  }

  const fetchProductData = async () => {

    products.map((item) => {
      if (item._id === productId) {
        setProductData(item)
        setImage(item.image[0])
        return null;
      }
    })

  }

  const fetchReviews = async () => {
    try {
      const response = await axios.get(backendUrl + `/api/review/product/${productId}`);
      if (response.data.success) {
        setReviews(response.data.reviews);
        setAverageRating(response.data.averageRating);
      }
    } catch (error) {
      console.log(error);
    }
  }

  const checkEligibility = async () => {
    try {
      if (!token) {
        setEligible(false);
        setEligibleMessage('');
        return;
      }
      const response = await axios.get(backendUrl + `/api/review/eligible/${productId}`, {
        headers: { token }
      });
      if (response.data.success) {
        setEligible(response.data.eligible);
        if (!response.data.eligible && response.data.message) {
          setEligibleMessage(response.data.message);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const response = await axios.post(
        backendUrl + '/api/review/add',
        { productId, rating: newRating, comment: newComment },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        setNewComment('');
        setNewRating(5);
        fetchReviews();
        checkEligibility();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <img 
          key={i} 
          src={i <= fullStars ? assets.star_icon : assets.star_dull_icon} 
          alt="" 
          className="w-3.5" 
        />
      );
    }
    return stars;
  }

  useEffect(() => {
    fetchProductData();
    fetchReviews();
  }, [productId,products])

  useEffect(() => {
    checkEligibility();
  }, [productId, token])

  return productData ? (
    <div className='border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100'>
      {/*----------- Product Data-------------- */}
      <div className='flex gap-12 sm:gap-12 flex-col sm:flex-row'>

        {/*---------- Product Images------------- */}
        <div className='flex-1 flex flex-col-reverse gap-3 sm:flex-row'>
          <div className='flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full'>
              {
                productData.image.map((item,index)=>(
                  <img onClick={()=>setImage(item)} src={item} key={index} className='w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer' alt="" />
                ))
              }
          </div>
          <div className='w-full sm:w-[80%]'>
              <img className='w-full h-auto' src={image} alt="" />
          </div>
        </div>

        {/* -------- Product Info ---------- */}
        <div className='flex-1'>
          <h1 className='font-medium text-2xl mt-2'>{productData.name}</h1>
          <div className=' flex items-center gap-1 mt-2'>
              {renderStars(averageRating)}
              <p className='pl-2 text-sm text-gray-500'>({reviews.length})</p>
          </div>
          <p className='mt-5 text-3xl font-medium'>{currency}{productData.price}</p>
          {productData.stock !== undefined && (
            <p className={`mt-2 font-medium ${activeStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {activeStock > 0 
                ? `In Stock: ${activeStock} available ${size ? `for size ${size}` : '(total across all sizes)'}` 
                : `Out of Stock ${size ? `for size ${size}` : ''}`}
            </p>
          )}
          <p className='mt-5 text-gray-500 md:w-4/5'>{productData.description}</p>
          <div className='flex flex-col gap-4 my-8'>
              <p>Select Size</p>
              <div className='flex gap-2'>
                {productData.sizes.map((item,index)=>(
                  <button onClick={()=>setSize(item)} className={`border py-2 px-4 bg-gray-100 ${item === size ? 'border-orange-500' : ''}`} key={index}>{item}</button>
                ))}
              </div>
          </div>
          {isAdded ? (
            <div className='flex items-center gap-4 my-4'>
              <div className='flex items-center border border-gray-300 rounded'>
                <button 
                  onClick={async () => {
                    if (loading) return;
                    setLoading(true);
                    await updateQuantity(productData._id, size, currentQty - 1);
                    setLoading(false);
                  }}
                  className='px-4 py-2 hover:bg-gray-100 active:bg-gray-200 transition text-lg font-bold'
                  disabled={loading}
                >
                  -
                </button>
                <span className='px-6 py-2 font-medium text-base min-w-[40px] text-center border-l border-r border-gray-300'>
                  {currentQty}
                </span>
                <button 
                  onClick={async () => {
                    if (loading) return;
                    if (currentQty + 1 > activeStock) {
                      toast.error(`Only ${activeStock} items available in stock`);
                      return;
                    }
                    setLoading(true);
                    await updateQuantity(productData._id, size, currentQty + 1);
                    setLoading(false);
                  }}
                  className='px-4 py-2 hover:bg-gray-100 active:bg-gray-200 transition text-lg font-bold'
                  disabled={loading}
                >
                  +
                </button>
              </div>
              <button 
                onClick={async () => {
                  if (loading) return;
                  setLoading(true);
                  await updateQuantity(productData._id, size, 0);
                  setLoading(false);
                }}
                className='border border-red-500 text-red-500 hover:bg-red-50 py-2.5 px-4 text-xs font-semibold rounded transition'
                disabled={loading}
              >
                REMOVE
              </button>
            </div>
          ) : (
            <button 
              onClick={handleButtonClick} 
              disabled={loading || activeStock <= 0} 
              className='bg-black text-white px-8 py-3 text-sm active:bg-gray-700 disabled:opacity-50 inline-flex items-center gap-2 justify-center'
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  ADDING TO CART...
                </>
              ) : activeStock <= 0 ? (
                'OUT OF STOCK'
              ) : (
                'ADD TO CART'
              )}
            </button>
          )}
          <hr className='mt-8 sm:w-4/5' />
          <div className='text-sm text-gray-500 mt-5 flex flex-col gap-1'>
              <p>100% Original product.</p>
              <p>Easy return and exchange policy within 7 days.</p>
          </div>
        </div>
      </div>

      {/* ---------- Description & Review Section ------------- */}
      <div className='mt-20'>
        <div className='flex'>
          <button 
            onClick={() => setActiveTab('description')} 
            className={`border px-5 py-3 text-sm transition ${activeTab === 'description' ? 'font-bold bg-slate-50 text-black border-b-transparent' : 'text-gray-500 hover:text-black'}`}
          >
            Description
          </button>
          <button 
            onClick={() => setActiveTab('reviews')} 
            className={`border px-5 py-3 text-sm transition ${activeTab === 'reviews' ? 'font-bold bg-slate-50 text-black border-b-transparent' : 'text-gray-500 hover:text-black'}`}
          >
            Reviews ({reviews.length})
          </button>
        </div>
        
        {activeTab === 'description' ? (
          <div className='flex flex-col gap-4 border px-6 py-6 text-sm text-gray-500 bg-slate-50/50 rounded-b-sm'>
            <p>{productData.description}</p>
          </div>
        ) : (
          <div className='border px-6 py-6 text-sm text-gray-500 flex flex-col gap-6 bg-slate-50/50 rounded-b-sm'>
            {/* Reviews List */}
            <div className='flex flex-col gap-5 max-h-[400px] overflow-y-auto pr-2'>
              {reviews.length === 0 ? (
                <p className='italic text-gray-400 py-4'>No reviews yet for this product.</p>
              ) : (
                reviews.map((rev, index) => (
                  <div key={index} className='border-b pb-4 last:border-0 last:pb-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span className='font-semibold text-gray-800'>{rev.userName}</span>
                      <div className='flex gap-0.5'>
                        {renderStars(rev.rating)}
                      </div>
                      <span className='text-xs text-gray-400 ml-auto'>{new Date(rev.date).toLocaleDateString()}</span>
                    </div>
                    <p className='text-gray-600 mt-1 pl-1'>{rev.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Write a Review Section */}
            <div className='border-t pt-6 mt-4'>
              <h3 className='font-semibold text-gray-800 text-base mb-4'>Write a Customer Review</h3>
              
              {!token ? (
                <p className='text-sm text-gray-400'>
                  Please{' '}
                  <span onClick={() => navigate('/login')} className='text-blue-500 hover:underline cursor-pointer font-medium'>
                    login
                  </span>{' '}
                  to leave a review.
                </p>
              ) : eligible ? (
                <form onSubmit={handleReviewSubmit} className='flex flex-col gap-4 max-w-lg bg-white p-4 sm:p-5 border rounded-sm shadow-sm'>
                  <div className='flex items-center gap-3'>
                    <span className='text-sm font-medium text-gray-700'>Your Rating:</span>
                    <div className='flex gap-1.5'>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <img 
                          key={star} 
                          onClick={() => setNewRating(star)} 
                          src={star <= newRating ? assets.star_icon : assets.star_dull_icon} 
                          alt="" 
                          className='w-5 cursor-pointer hover:scale-110 transition' 
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className='flex flex-col gap-1'>
                    <label className='text-sm font-medium text-gray-700'>Your Comment:</label>
                    <textarea 
                      value={newComment} 
                      onChange={(e) => setNewComment(e.target.value)} 
                      rows={4}
                      placeholder="Share your thoughts about this product..."
                      className='w-full border p-2 outline-none focus:border-black rounded-sm transition'
                      required
                    />
                  </div>

                  <button 
                    disabled={submitting} 
                    className='bg-black text-white text-xs font-medium py-3 px-6 hover:bg-gray-800 transition disabled:opacity-50 self-start inline-flex items-center gap-2 rounded-sm'
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        SUBMITTING...
                      </>
                    ) : 'SUBMIT REVIEW'}
                  </button>
                </form>
              ) : (
                <p className='text-sm text-gray-400 italic bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-sm'>{eligibleMessage || "Only verified buyers who have received their delivery can leave a review."}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --------- display related products ---------- */}

      <RelatedProducts category={productData.category} subCategory={productData.subCategory} />

    </div>
  ) : <div className=' opacity-0'></div>
}

export default Product
