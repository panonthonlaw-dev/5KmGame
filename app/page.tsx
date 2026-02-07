"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function TrafficGameLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');

  // เคลียร์ค่า error เมื่อเริ่มพิมพ์ใหม่
  useEffect(() => {
    setErrorMsg('');
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔑 ระบบ Login (เช็คจากตาราง users โดยตรง)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (!formData.username || !formData.password) {
        setErrorMsg("กรุณากรอกข้อมูลให้ครบถ้วน");
        setLoading(false);
        return;
    }

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', formData.username)
        .single();

      if (error || !user) {
        setErrorMsg("❌ ไม่พบชื่อผู้ใช้นี้ในระบบ");
      } else if (user.password === formData.password) {
        // ล็อคอินสำเร็จ! เก็บข้อมูลแล้วไปหน้า Dashboard
        localStorage.setItem('user', JSON.stringify(user));
        router.push('/dashboard');
      } else {
        setErrorMsg("❌ รหัสผ่านไม่ถูกต้อง");
      }
    } catch (err) {
      setErrorMsg("⚠️ ระบบเชื่อมต่อมีปัญหา กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  // 🎨 Pastel & Minimal Styles
  const CONTAINER_STYLE = "bg-white rounded-[30px] p-10 shadow-[0_10px_40px_rgba(0,0,0,0.08)] w-full max-w-[420px] text-center transition-all hover:shadow-[0_15px_50px_rgba(174,217,224,0.3)]";
  const INPUT_STYLE = "w-full h-[55px] bg-[#F7F9FC] border-[2px] border-transparent rounded-[18px] px-6 text-gray-600 font-medium outline-none focus:border-[#AED9E0] focus:bg-white transition-all placeholder:text-gray-300";
  // ปุ่มสีฟ้าพาสเทล (Login)
  const BTN_PASTEL_BLUE = "w-full h-[55px] bg-[#AED9E0] hover:bg-[#9BCDD2] text-white font-black rounded-[18px] text-[18px] transition-all active:scale-95 shadow-sm mt-4 flex items-center justify-center";
  // ปุ่มสีเขียวพาสเทล (Signup)
  const BTN_PASTEL_GREEN = "w-full h-[55px] bg-[#A8E6CF] hover:bg-[#94D3BD] text-white font-black rounded-[18px] text-[16px] transition-all active:scale-95 shadow-sm mb-4";

  return (
    // พื้นหลังสีครีมอ่อนนุ่ม
    <main className="min-h-screen flex flex-col items-center justify-center p-6 font-sans" style={{ backgroundColor: '#FDFCF8' }}>
      
      <div className={CONTAINER_STYLE}>
        {/* 🎈 Header น่ารักๆ */}
        <header className="mb-8">
          <h1 className="text-[42px] font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#AED9E0] to-[#C3B1E1] leading-tight">
            traffic game
          </h1>
          <p className="text-[16px] font-bold text-gray-400 mt-2">
            — เล่น • เปลี่ยน • รอด —
          </p>
        </header>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="text-left">
             <label className="text-[14px] font-bold text-gray-500 ml-2 mb-1 block">USERNAME</label>
             <input 
               name="username" type="text" placeholder="กรอกชื่อผู้ใช้..." 
               onChange={handleChange} className={INPUT_STYLE} 
             />
          </div>

          <div className="text-left">
             <label className="text-[14px] font-bold text-gray-500 ml-2 mb-1 block">PASSWORD</label>
             <input 
               name="password" type="password" placeholder="กรอกรหัสผ่าน..." 
               onChange={handleChange} className={INPUT_STYLE} 
             />
          </div>
          
          {/* แสดง Error Message ถ้ามี */}
          {errorMsg && (
            <p className="text-red-400 text-sm font-bold bg-red-50 py-2 rounded-lg shake-animation">{errorMsg}</p>
          )}

          <button type="submit" disabled={loading} className={BTN_PASTEL_BLUE}>
            {loading ? (
                <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    กำลังเข้าสู่ระบบ...
                </span>
            ) : 'เข้าสู่ระบบ (LOGIN)'}
          </button>
        </form>

        {/* 🔗 ลิงก์ไปหน้าลืมรหัสผ่าน */}
        <div className="mt-5 mb-8">
          <button 
            onClick={() => router.push('/forgot-password')}
            className="text-[14px] font-bold text-[#AED9E0] hover:text-[#9BCDD2] transition-all hover:underline"
          >
            ลืมรหัสผ่านใช่ไหม?
          </button>
        </div>

        {/* 🟢 ปุ่มไปหน้าสมัครสมาชิก */}
        <button 
          className={BTN_PASTEL_GREEN}
          onClick={() => router.push('/signup')}
        >
          ยังไม่มีบัญชี? สร้างใหม่เลย
        </button>

      </div>

      <footer className="mt-8 text-[12px] font-bold text-gray-300 tracking-widest">
        © 2026 TRAFFIC GAME PROJECT
      </footer>

    </main>
  );
}