import React, { useEffect, useState } from 'react';

const ServerLoader = ({ error, onRetry }) => {
    const [progress, setProgress] = useState(0);
    const [secondsLeft, setSecondsLeft] = useState(50);

    useEffect(() => {
        if (error) return;

        // Progress bar simulation (reaches 95% gradually, then waits for real completion)
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return 95;
                const increment = Math.max(0.5, (100 - prev) / 15);
                return prev + increment;
            });
        }, 1000);

        // Countdown timer
        const timerInterval = setInterval(() => {
            setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => {
            clearInterval(progressInterval);
            clearInterval(timerInterval);
        };
    }, [error]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-md transition-all duration-500">
            <div className="max-w-md w-full mx-4 p-8 bg-slate-50 border border-slate-200 rounded-2xl shadow-xl text-center relative overflow-hidden">
                {/* Glowing aesthetic accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-black animate-pulse" />

                {!error ? (
                    <div className="flex flex-col items-center">
                        {/* Rebranded logo placeholder / Icon */}
                        <div className="mb-6 relative">
                            <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-black animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center font-bold text-sm tracking-tighter text-slate-800">
                                FF
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                            Waking Up Server...
                        </h3>
                        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                            FitFusion is hosted on a free Render tier. It is spinning up and our database is establishing a connection. This will take up to <span className="font-semibold text-black">{secondsLeft}s</span>.
                        </p>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-3">
                            <div 
                                className="bg-black h-full transition-all duration-1000 ease-out" 
                                style={{ width: `${progress}%` }} 
                            />
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                            {Math.round(progress)}% Loaded
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-2xl mb-6">
                            ⚠️
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                            Spin Up Delay
                        </h3>
                        <p className="text-sm text-slate-600 mb-8 leading-relaxed">
                            We're having trouble connecting to the backend. The server might still be waking up, or there is a connection issue.
                        </p>
                        <button 
                            onClick={onRetry}
                            className="w-full bg-black text-white hover:bg-slate-800 transition-all font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98]"
                        >
                            Retry Connection
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServerLoader;
