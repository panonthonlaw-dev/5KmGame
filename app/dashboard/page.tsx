"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [rank, setRank] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initDashboard = async () => {
      // 1. ตรวจสอบ Session
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        router.push('/');
        return;
      }
      const userData = JSON.parse(savedUser);

      // 2. ดึงข้อมูลล่าสุดจาก Supabase (เพื่อให้ Rank/EXP อัปเดตเสมอ)
      const { data: latestUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userData.id)
        .single();

      if (latestUser) {
        setUser(latestUser);
        // 3. คำนวณอันดับ (Ranking Logic)
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gt('exp', latestUser.exp);
        
        setRank((count || 0) + 1);
      }
      setLoading(false);
    };

    initDashboard();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
      <p className="font-black text-black animate-pulse">กำลังโหลดข้อมูลระบบ...</p>
    </div>
  );

  return (
    <main className="min-h-screen p-8 text-black font-sans" style={{ backgroundColor: '#FDFCF8' }}>
      
      {/* ส่วนหัว: ข้อมูลนักเรียน */}
      <header className="mb-12 text-center">
        <div className="w-20 h-20 bg-[#AED9E0] rounded-full mx-auto mb-4 flex items-center justify-center text-[30px]">
          {user.username?.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-[32px] font-black leading-tight text-black">{user.username}</h1>
        <p className="font-bold text-gray-500 uppercase tracking-widest text-[12px]">Student Profile</p>
      </header>

      {/* บัตรข้อมูลสถานะ (Status Grid) */}
      <div className="grid grid-cols-1 gap-4 max-w-[340px] mx-auto mb-10">
        <div className="flex justify-between items-center py-4 border-b-2 border-[#F2F2F2]">
          <span className="font-black text-[13px] text-gray-400">ระดับ (LEVEL)</span>
          <span className="text-[26px] font-black">{user.level || 1}</span>
        </div>
        <div className="flex justify-between items-center py-4 border-b-2 border-[#F2F2F2]">
          <span className="font-black text-[13px] text-gray-400">ค่าประสบการณ์ (EXP)</span>
          <span className="text-[22px] font-black">{user.exp || 0} <span className="text-[12px]">PTS</span></span>
        </div>
        <div className="flex justify-between items-center py-4 border-b-2 border-[#F2F2F2]">
          <span className="font-black text-[13px] text-gray-400">อันดับในโรงเรียน</span>
          <span className="text-[22px] font-black" style={{ color: '#AED9E0' }}>#{rank}</span>
        </div>
      </div>

      {/* ปุ่มกดหลัก: ขนาดสมมาตร 320px */}
      <nav className="flex flex-col items-center gap-4">
        <button className="w-[320px] h-[60px] bg-[#AED9E0] text-black font-black rounded-[18px] text-[18px] hover:scale-105 transition-all">
          เริ่มเข้าสู่บทเรียน
        </button>
        <button className="w-[320px] h-[60px] bg-[#A8E6CF] text-black font-black rounded-[18px] text-[18px] hover:scale-105 transition-all">
          ตารางคะแนน (LEADERBOARD)
        </button>
        <button 
          onClick={() => { localStorage.clear(); router.push('/'); }}
          className="mt-8 text-black font-black text-[14px] hover:underline uppercase tracking-tighter"
        >
          ออกจากระบบ (Logout)
        </button>
      </nav>

    </main>
  );
}