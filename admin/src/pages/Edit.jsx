import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const Edit = ({ token }) => {

  const { productId } = useParams();
  const navigate = useNavigate();

  const [image1, setImage1] = useState(false)
  const [image2, setImage2] = useState(false)
  const [image3, setImage3] = useState(false)
  const [image4, setImage4] = useState(false)

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Men");
  const [subCategory, setSubCategory] = useState("Topwear");
  const [bestseller, setBestseller] = useState(false);
  const [sizes, setSizes] = useState([]);
  const [stock, setStock] = useState({ S: "", M: "", L: "", XL: "", XXL: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.post(backendUrl + '/api/product/single', { productId })
        if (response.data.success) {
          const product = response.data.product
          setName(product.name)
          setDescription(product.description)
          setPrice(product.price.toString())
          setCategory(product.category)
          setSubCategory(product.subCategory)
          setBestseller(product.bestseller || false)
          setSizes(product.sizes || [])
          
          let loadedStock = { S: "", M: "", L: "", XL: "", XXL: "" };
          if (product.stock !== undefined && product.stock !== null) {
            if (typeof product.stock === 'object') {
              for (const sizeKey of ["S", "M", "L", "XL", "XXL"]) {
                loadedStock[sizeKey] = product.stock[sizeKey] !== undefined ? product.stock[sizeKey].toString() : "";
              }
            } else {
              for (const sz of product.sizes || []) {
                loadedStock[sz] = product.stock.toString();
              }
            }
          }
          setStock(loadedStock)
          setImage1(product.image[0] || false)
          setImage2(product.image[1] || false)
          setImage3(product.image[2] || false)
          setImage4(product.image[3] || false)
        } else {
          toast.error(response.data.message)
        }
      } catch (error) {
        console.log(error)
        toast.error(error.message)
      }
    }
    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {

      const formData = new FormData()

      const finalStock = {};
      sizes.forEach(sz => {
        finalStock[sz] = Math.max(0, Math.floor(Number(stock[sz]))) || 0;
      });

      formData.append("id", productId)
      formData.append("name", name)
      formData.append("description", description)
      formData.append("price", price)
      formData.append("category", category)
      formData.append("subCategory", subCategory)
      formData.append("bestseller", bestseller)
      formData.append("sizes", JSON.stringify(sizes))
      formData.append("stock", JSON.stringify(finalStock))

      const existingImages = [
        typeof image1 === 'string' ? image1 : null,
        typeof image2 === 'string' ? image2 : null,
        typeof image3 === 'string' ? image3 : null,
        typeof image4 === 'string' ? image4 : null,
      ]
      formData.append("existingImages", JSON.stringify(existingImages))

      if (image1 && typeof image1 !== 'string') formData.append("image1", image1)
      if (image2 && typeof image2 !== 'string') formData.append("image2", image2)
      if (image3 && typeof image3 !== 'string') formData.append("image3", image3)
      if (image4 && typeof image4 !== 'string') formData.append("image4", image4)

      const response = await axios.post(backendUrl + "/api/product/edit", formData, { headers: { token } })

      if (response.data.success) {
        toast.success(response.data.message)
        navigate('/list')
      } else {
        toast.error(response.data.message)
      }

    } catch (error) {
      console.log(error);
      toast.error(error.message)
    } finally {
      setLoading(false);
    }
  }

  const getImageUrl = (imageState) => {
    if (!imageState) return assets.upload_area;
    if (typeof imageState === 'string') return imageState;
    return URL.createObjectURL(imageState);
  }

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-3'>
      <div>
        <p className='mb-2'>Upload Image (Click to change)</p>

        <div className='flex gap-2'>
          <label htmlFor="image1" className="cursor-pointer">
            <img className='w-20 h-20 object-cover border' src={getImageUrl(image1)} alt="" />
            <input onChange={(e) => setImage1(e.target.files[0])} type="file" id="image1" hidden />
          </label>
          <label htmlFor="image2" className="cursor-pointer">
            <img className='w-20 h-20 object-cover border' src={getImageUrl(image2)} alt="" />
            <input onChange={(e) => setImage2(e.target.files[0])} type="file" id="image2" hidden />
          </label>
          <label htmlFor="image3" className="cursor-pointer">
            <img className='w-20 h-20 object-cover border' src={getImageUrl(image3)} alt="" />
            <input onChange={(e) => setImage3(e.target.files[0])} type="file" id="image3" hidden />
          </label>
          <label htmlFor="image4" className="cursor-pointer">
            <img className='w-20 h-20 object-cover border' src={getImageUrl(image4)} alt="" />
            <input onChange={(e) => setImage4(e.target.files[0])} type="file" id="image4" hidden />
          </label>
        </div>
      </div>

      <div className='w-full'>
        <p className='mb-2'>Product name</p>
        <input onChange={(e) => setName(e.target.value)} value={name} className='w-full max-w-[500px] px-3 py-2 border' type="text" placeholder='Type here' required />
      </div>

      <div className='w-full'>
        <p className='mb-2'>Product description</p>
        <textarea onChange={(e) => setDescription(e.target.value)} value={description} className='w-full max-w-[500px] px-3 py-2 border' type="text" placeholder='Write content here' required />
      </div>

      <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>

        <div>
          <p className='mb-2'>Product category</p>
          <select onChange={(e) => setCategory(e.target.value)} value={category} className='w-full px-3 py-2 border'>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Kids">Kids</option>
          </select>
        </div>

        <div>
          <p className='mb-2'>Sub category</p>
          <select onChange={(e) => setSubCategory(e.target.value)} value={subCategory} className='w-full px-3 py-2 border'>
            <option value="Topwear">Topwear</option>
            <option value="Bottomwear">Bottomwear</option>
            <option value="Winterwear">Winterwear</option>
          </select>
        </div>

        <div>
          <p className='mb-2'>Product Price</p>
          <input onChange={(e) => setPrice(e.target.value)} value={price} className='w-full px-3 py-2 sm:w-[120px] border' type="Number" placeholder='25' min="0" required />
        </div>

      </div>

      <div>
        <p className='mb-2'>Product Sizes & Stocks</p>
        <div className='flex flex-col gap-3 max-w-[350px] w-full'>
          {["S", "M", "L", "XL", "XXL"].map((sz) => {
            const isSelected = sizes.includes(sz);
            return (
              <div key={sz} className='flex items-center gap-4 justify-between border-b pb-2 w-full'>
                <div 
                  type="button"
                  onClick={() => setSizes(prev => prev.includes(sz) ? prev.filter(item => item !== sz) : [...prev, sz])}
                  className={`${isSelected ? "bg-pink-100 border-pink-400" : "bg-slate-200 border-transparent"} border px-4 py-1.5 cursor-pointer rounded-sm font-medium w-16 text-center select-none`}
                >
                  {sz}
                </div>
                {isSelected && (
                  <div className='flex items-center gap-2'>
                    <span className='text-xs text-gray-500'>Stock:</span>
                    <input 
                      type="number"
                      min="0"
                      required
                      placeholder="Qty"
                      value={stock[sz] || ""}
                      onChange={(e) => setStock(prev => ({ ...prev, [sz]: e.target.value }))}
                      className='w-20 px-2 py-1 border border-gray-300 rounded'
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className='flex gap-2 mt-2'>
        <input onChange={() => setBestseller(prev => !prev)} checked={bestseller} type="checkbox" id='bestseller' />
        <label className='cursor-pointer' htmlFor="bestseller">Add to bestseller</label>
      </div>

      <div className='flex gap-4 mt-4'>
        <button
          type="submit"
          disabled={loading}
          className='w-36 py-3 bg-black text-white disabled:opacity-50 flex items-center gap-2 justify-center cursor-pointer'
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              SAVING...
            </>
          ) : 'SAVE CHANGES'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/list')}
          className='w-36 py-3 bg-slate-200 text-gray-700 hover:bg-slate-300 flex items-center gap-2 justify-center cursor-pointer'
        >
          CANCEL
        </button>
      </div>

    </form>
  )
}

export default Edit
