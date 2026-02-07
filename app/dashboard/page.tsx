"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthPage() {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    username: '', firstName: '', lastName: '', studentId: '',
    grade: 'ม.1', room: '1', password: '', confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: `${formData.username.toLowerCase()}@5km.com`,
          password: formData.password
        });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  // 📏 ล็อกขนาดเท่ากันเป๊ะ: กว้าง 280px สูง 56px
  const UI_BASE = "w-[280px] h-[56px] rounded-2xl flex items-center justify-center transition-all duration-200 border-2";
  
  return (
    // 🎨 พื้นหลังจอสีเทาอ่อนมาก เพื่อให้กล่องสีขาวดูมีมิติ
    <main className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-6 font-sans">
      
      {/* 📦 กล่องระบบหลัก */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[360px] min-h-[660px] bg-white border-2 border-black rounded-[3rem] py-12 flex flex-col items-center shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
      >
        
        {/* Header: ตัวหนังสือดำสนิท */}
        <header className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tighter text-black uppercase">5 KM RIDER</h1>
          <p className="text-[#1877f2] text-[11px] font-black mt-2 tracking-[0.25em] uppercase">เล่น • เปลี่ยน • รอด</p>
          <div className="h-1 w-10 bg-black mx-auto mt-4 rounded-full"></div>
        </header>

        <form onSubmit={handleAuth} className="w-full flex-1 flex flex-col items-center justify-center space-y-10">
          <AnimatePresence mode="wait">
            {view === 'login' && (
              <motion.div key="login" className="flex flex-col items-center space-y-6">
                
                {/* Username: พื้นหลังช่องกรอกสีเทาอ่อนตัดกับตัวหนังสือดำ */}
                <div className="flex flex-col items-center">
                  <label className="w-[280px] text-[12px] font-black text-black uppercase mb-2 ml-1 text-left">User ID</label>
                  <input 
                    name="username" type="text" onChange={handleChange} placeholder="Username"
                    className={`${UI_BASE} bg-[#f8f9fa] border-gray-200 text-black font-bold focus:border-black focus:bg-white outline-none px-4 text-center`}
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col items-center">
                  <label className="w-[280px] text-[12px] font-black text-black uppercase mb-2 ml-1 text-left">Password</label>
                  <input 
                    name="password" type="password" onChange={handleChange} placeholder="••••••••"
                    className={`${UI_BASE} bg-[#f8f9fa] border-gray-200 text-black font-bold focus:border-black focus:bg-white outline-none px-4 text-center`}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Buttons: ล็อกขนาดเท่ากับ Input */}
          <div className="flex flex-col items-center space-y-4 pt-4">
            <button disabled={loading} className={`${UI_BASE} bg-[#1877f2] border-[#1877f2] text-white font-black text-lg active:scale-95 shadow-lg shadow-blue-100`}>
              {loading ? 'WAIT...' : 'LOG IN'}
            </button>
            <button type="button" onClick={() => setView(view === 'login' ? 'signup' : 'login')} className={`${UI_BASE} bg-[#42b72a] border-[#42b72a] text-white font-black text-xs tracking-widest active:scale-95`}>
              CREATE ACCOUNT
            </button>
          </div>
        </form>

        <footer className="mt-10">
          <span className="text-[13px] font-black text-black border-b-2 border-black cursor-pointer hover:text-[#1877f2] hover:border-[#1877f2] transition-colors">
            Forgotten password?
          </span>
        </footer>
      </motion.div>
    </main>
  );
}