"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('exp', { ascending: false });
    if (data) setUsers(data);
  };

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="min-h-screen p-8 text-black font-sans" style={{ backgroundColor: '#FDFCF8' }}>
      <div className="max-w-[500px] mx-auto">
        <header className="mb-10">
          <h1 className="text-[40px] font-black leading-none" style={{ color: '#AED9E0' }}>ADMIN</h1>
          <p className="font-black text-[16px] text-black">ศูนย์ควบคุมระบบ Traffic Game</p>
        </header>

        {/* ช่องค้นหา */}
        <input 
          type="text" 
          placeholder="ค้นหาชื่อนักเรียน..." 
          className="w-full h-[50px] bg-[#F2F2F2] rounded-[15px] px-5 font-bold mb-8 outline-none focus:bg-white transition-all border-none"
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* รายชื่อนักเรียน */}
        <div className="space-y-4">
          {filteredUsers.map((u, index) => (
            <div key={u.id} className="bg-white p-6 rounded-[25px] flex justify-between items-center transition-all hover:scale-[1.02]">
              <div>
                <span className="text-[10px] font-black text-gray-300 uppercase">Rank #{index + 1}</span>
                <p className="font-black text-[20px] leading-tight text-black">{u.username}</p>
                <div className="flex gap-3 mt-1">
                  <span className="bg-[#FDFCF8] text-[10px] font-black px-2 py-1 rounded-md text-gray-500">LVL: {u.level}</span>
                  <span className="bg-[#FDFCF8] text-[10px] font-black px-2 py-1 rounded-md text-gray-500">EXP: {u.exp}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button className="bg-[#AED9E0] w-[80px] py-2 rounded-[10px] font-black text-[12px] text-black">
                  แก้ไข
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}