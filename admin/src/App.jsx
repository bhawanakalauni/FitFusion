import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { Routes, Route } from 'react-router-dom'
import Add from './pages/Add'
import List from './pages/List'
import Orders from './pages/Orders'
import Edit from './pages/Edit'
import Login from './components/Login'
import ServerLoader from './components/ServerLoader'
import axios from 'axios'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = '₹'

const App = () => {

  const [token, setToken] = useState(localStorage.getItem('token')?localStorage.getItem('token'):'');
  const [serverLoading, setServerLoading] = useState(true);
  const [serverError, setServerError] = useState(false);

  const checkServerStatus = async () => {
    setServerLoading(true);
    setServerError(false);
    try {
      const response = await axios.get(backendUrl + '/test');
      if (response.data.success) {
        setServerLoading(false);
      } else {
        setServerError(true);
      }
    } catch (error) {
      console.log(error);
      setServerError(true);
    }
  };

  useEffect(() => {
    checkServerStatus();
  }, []);

  useEffect(()=>{
    localStorage.setItem('token',token)
  },[token])

  return (
    <div className='bg-gray-50 min-h-screen'>
      <ToastContainer />
      {serverLoading && <ServerLoader error={serverError} onRetry={checkServerStatus} />}
      {token === ""
        ? <Login setToken={setToken} />
        : <>
          <Navbar setToken={setToken} />
          <hr />
          <div className='flex w-full'>
            <Sidebar />
            <div className='w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base'>
              <Routes>
                <Route path='/add' element={<Add token={token} />} />
                <Route path='/edit/:productId' element={<Edit token={token} />} />
                <Route path='/list' element={<List token={token} />} />
                <Route path='/orders' element={<Orders token={token} />} />
              </Routes>
            </div>
          </div>
        </>
      }
    </div>
  )
}

export default App