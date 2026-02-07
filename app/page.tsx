"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase'; // เช็คให้ชัวร์ว่า path นี้ถูกต้องนะครับ
import { useRouter } from 'next/navigation';

export default function TrafficGameLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔑 ระบบ Login (ถอด Logic จาก Streamlit ของ Master มาเป๊ะๆ)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. ดึงข้อมูลจากตาราง "users" โดยเช็คจาก Username
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', formData.username)
        .single();

      if (error || !user) {
        alert("❌ ไม่พบชื่อผู้ใช้นี้ในระบบ");
      } else {
        // 2. เช็ค Password ตรงๆ ตามที่ Master เขียนไว้ใน Streamlit
        if (user.password === formData.password) {
          // เก็บข้อมูลลง LocalStorage เพื่อให้ Dashboard ดึงไปใช้ต่อได้ (แทน session_state)
          localStorage.setItem('user', JSON.stringify(user));
          router.push('/dashboard');
        } else {
          alert("❌ รหัสผ่านไม่ถูกต้อง");
        }
      }
    } catch (err) {
      alert("⚠️ ระบบเชื่อมต่อมีปัญหา");
    } finally {
      setLoading(false);
    }
  };

  // 📏 มาตรฐานความสมมาตร: กว้าง 320px สูง 50px เท่ากันทุกลูก
  const UI_SIZE = "w-[320px] h-[50px] rounded-[10px]";
  const INPUT_STYLE = `${UI_SIZE} border-[1px] border-black bg-white text-black font-bold px-4 outline-none focus:border-[#1877f2] placeholder:text-gray-300`;
  const BTN_BLUE = `${UI_SIZE} bg-[#1877f2] text-white font-black text-[18px] active:scale-[0.98] transition-all border-none`;
  const BTN_GREEN = `${UI_SIZE} bg-[#42b72a] text-white font-black text-[16px] active:scale-[0.98] transition-all border-none`;

  return (
    // ⚪️ พื้นหลังขาวจั๊วะ 100% (บังคับ Style ไม่ให้ Dark Mode มาทับ)
    <main className="min-h-screen flex flex-col items-center justify-center p-4 font-sans" style={{ backgroundColor: '#ffffff' }}>
      
      {/* 🔵 LOGO: traffic game */}
      <header className="mb-10 text-center">
        <h1 className="text-[48px] font-black tracking-tighter leading-none mb-2" style={{ color: '#1877f2' }}>
          traffic game
        </h1>
        <p className="text-[18px] font-bold" style={{ color: '#003366' }}>
          เล่นเปลี่ยนรอด
        </p>
      </header>

      {/* 📦 กล่องระบบ: ขาว ขอบดำบาง 1px */}
      <div className="bg-white border-[1px] border-black rounded-[20px] p-8 shadow-sm flex flex-col items-center" style={{ backgroundColor: '#ffffff' }}>
        
        <form onSubmit={handleLogin} className="flex flex-col items-center gap-5">
          {/* Username Input */}
          <div className="flex flex-col items-center">
            <label className="w-[320px] text-[13px] font-black uppercase mb-1.5 text-left" style={{ color: '#000000' }}>Username</label>
            <input 
              name="username" type="text" placeholder="Username" 
              onChange={handleChange} className={INPUT_STYLE} 
            />
          </div>

          {/* Password Input */}
          <div className="flex flex-col items-center">
            <label className="w-[320px] text-[13px] font-black uppercase mb-1.5 text-left" style={{ color: '#000000' }}>Password</label>
            <input 
              name="password" type="password" placeholder="Password" 
              onChange={handleChange} className={INPUT_STYLE} 
            />
          </div>

          {/* 🔵 ปุ่มเข้าสู่ระบบ (สีน้ำเงิน) */}
          <button type="submit" className={`${BTN_BLUE} mt-2`}>
            {loading ? 'กำลังโหลด...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        {/* Link ลืมรหัสผ่าน */}
        <div className="mt-4">
          <button className="text-[14px] font-bold hover:underline" style={{ color: '#1877f2' }}>
            คุณลืมรหัสผ่านใช่ไหม
          </button>
        </div>

        {/* เส้นคั่นบางๆ */}
        <div className="w-[320px] border-b-[1px] border-gray-100 my-8"></div>

        {/* 🟢 ปุ่มสร้างบัญชีใหม่ (สีเขียว) */}
        <button className={BTN_GREEN}>
          สร้างบัญชีใหม่
        </button>
      </div>

      <footer className="mt-12 text-[11px] font-black text-gray-300 uppercase tracking-widest">
        System 2026 // Traffic Game Project
      </footer>

    </main>
  );
}