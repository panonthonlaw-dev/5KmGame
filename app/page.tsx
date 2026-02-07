"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function TrafficGameLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', formData.username)
        .single();

      if (error || !user) {
        setErrorMsg("❌ ไม่พบชื่อผู้ใช้นี้");
      } else if (user.password === formData.password) {
        localStorage.setItem('user', JSON.stringify(user));
        router.push('/dashboard');
      } else {
        setErrorMsg("❌ รหัสผ่านไม่ถูกต้อง");
      }
    } catch (err) {
      setErrorMsg("⚠️ ระบบมีปัญหา กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  // 📏 มาตรฐานความสมมาตร: 320px | ทุกจุดตัวหนังสือสีดำสนิท
  const INPUT_STYLE = "w-[320px] h-[50px] bg-[#F2F2F2] rounded-[12px] px-4 text-black font-bold outline-none border-none placeholder:text-gray-500";
  const BTN_BLUE = "w-[320px] h-[50px] bg-[#AED9E0] text-black font-black rounded-[12px] active:scale-95 transition-all mt-2";
  const BTN_GREEN = "w-[320px] h-[50px] bg-[#A8E6CF] text-black font-black rounded-[12px] active:scale-95 transition-all mt-4";

  return (
    // พื้นหลังครีมอ่อน บังคับสีตัวอักษรหลักเป็นสีดำ
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-black" style={{ backgroundColor: '#FDFCF8' }}>
      
      {/* 🔵 ชื่อเกมสีน้ำเงินพาสเทล */}
      <header className="mb-10 text-center">
        <h1 className="text-[54px] font-black tracking-tighter leading-none" style={{ color: '#AED9E0' }}>
          traffic game
        </h1>
        {/* ✅ แก้ไข: ใส่ text-black และ font-black ให้ชัดเจน */}
        <p className="text-[18px] font-black text-black mt-2">เล่น • เปลี่ยน • รอด</p>
      </header>

      {/* 📦 Container แบบไร้กรอบนอก */}
      <div className="w-full max-w-[360px] flex flex-col items-center">
        
        <form onSubmit={handleLogin} className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-start w-[320px]">
            {/* ✅ แก้ไข: Username label เป็นสีดำ */}
            <label className="text-[13px] font-black text-black mb-1.5 ml-1 uppercase">Username</label>
            <input 
              name="username" type="text" placeholder="กรอกชื่อผู้ใช้" 
              onChange={handleChange} className={INPUT_STYLE} 
            />
          </div>

          <div className="flex flex-col items-start w-[320px]">
            {/* ✅ แก้ไข: Password label เป็นสีดำ */}
            <label className="text-[13px] font-black text-black mb-1.5 ml-1 uppercase">Password</label>
            <input 
              name="password" type="password" placeholder="กรอกรหัสผ่าน" 
              onChange={handleChange} className={INPUT_STYLE} 
            />
          </div>

          {errorMsg && <p className="text-red-600 text-[14px] font-black mt-2">{errorMsg}</p>}

          <button type="submit" disabled={loading} className={BTN_BLUE}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <button 
          onClick={() => router.push('/signup')}
          className={BTN_GREEN}
        >
          สร้างบัญชีใหม่
        </button>

        {/* 🔗 ลืมรหัสผ่าน ล่างสุด สีดำสนิท */}
        <button 
          onClick={() => router.push('/forgot-password')}
          className="mt-12 text-[15px] font-black text-black hover:underline bg-transparent border-none p-0 cursor-pointer"
        >
          คุณลืมรหัสผ่านใช่ไหม?
        </button>

      </div>

      <footer className="mt-20 text-[11px] font-black text-gray-400 uppercase tracking-widest">
        Teacher Thee • 2026
      </footer>

    </main>
  );
}