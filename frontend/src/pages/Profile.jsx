import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title'
import axios from 'axios'
import { toast } from 'react-toastify'

const Profile = () => {
    const { backendUrl, token, navigate } = useContext(ShopContext);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const fetchUserProfile = async () => {
        try {
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await axios.get(backendUrl + '/api/user/profile', {
                headers: { token }
            });
            if (response.data.success) {
                setName(response.data.user.name);
                setEmail(response.data.user.email);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        } finally {
            setFetching(false);
        }
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        try {
            const response = await axios.post(
                backendUrl + '/api/user/profile/update',
                { name, email, password },
                { headers: { token } }
            );
            if (response.data.success) {
                toast.success(response.data.message);
                setPassword(''); // Clear password field
                setName(response.data.user.name);
                setEmail(response.data.user.email);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!token) {
            navigate('/login');
        } else {
            fetchUserProfile();
        }
    }, [token]);

    if (fetching) {
        return (
            <div className='flex justify-center items-center h-96'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-black'></div>
            </div>
        )
    }

    return (
        <div className='border-t pt-14 max-w-lg mx-auto'>
            <div className='text-2xl mb-6'>
                <Title text1={'MY'} text2={'PROFILE'} />
            </div>

            <form onSubmit={handleUpdateProfile} className='flex flex-col gap-5 text-gray-700 bg-slate-50 p-6 sm:p-8 border rounded-sm shadow-sm'>
                <div className='flex flex-col gap-1'>
                    <label className='text-sm font-medium'>Full Name</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className='w-full px-3 py-2 border rounded-sm outline-none focus:border-black transition'
                        required 
                    />
                </div>

                <div className='flex flex-col gap-1'>
                    <label className='text-sm font-medium'>Email Address</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className='w-full px-3 py-2 border rounded-sm outline-none focus:border-black transition'
                        required 
                    />
                </div>

                <div className='flex flex-col gap-1'>
                    <label className='text-sm font-medium'>New Password (leave blank to keep current)</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="••••••••"
                        className='w-full px-3 py-2 border rounded-sm outline-none focus:border-black transition'
                    />
                </div>

                <button 
                    disabled={loading} 
                    className='bg-black text-white text-sm font-medium py-3 px-6 rounded-sm mt-2 flex items-center justify-center gap-2 hover:bg-gray-800 transition disabled:opacity-50'
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving Changes...
                        </>
                    ) : 'SAVE CHANGES'}
                </button>
            </form>

            <div className='mt-8 flex flex-col gap-4 border-t pt-8'>
                <div className='flex justify-between items-center bg-slate-50 border p-4 sm:p-5 rounded-sm'>
                    <div>
                        <h4 className='font-medium text-gray-800'>Purchase History</h4>
                        <p className='text-xs text-gray-500 mt-1'>Check, track, and review your past orders.</p>
                    </div>
                    <button 
                        onClick={() => navigate('/orders')} 
                        className='border border-black text-xs font-medium py-2 px-4 hover:bg-black hover:text-white transition'
                    >
                        VIEW MY ORDERS
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Profile
