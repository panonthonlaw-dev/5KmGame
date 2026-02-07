"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    // ดึงรายชื่อนักเรียนทั้งหมดจากตาราง profiles
    const fetchStudents = async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data) setStudents(data);
    };
    fetchStudents();
  }, []);

  return (
    <div className="p-8 font-mono">
      <h1 className="text-3xl font-black text-[#4ade80] mb-6 italic underline">CONTROL CENTER (ADMIN)</h1>
      <div className="overflow-x-auto border-4 border-[#3a3a50]">
        <table className="w-full text-left bg-[#1a1a2e]">
          <thead className="bg-[#3a3a50] text-[#4ade80] uppercase">
            <tr>
              <th className="p-4">Username</th>
              <th className="p-4">Name</th>
              <th className="p-4">Grade/Room</th>
              <th className="p-4">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3a3a50]">
            {students.map((std) => (
              <tr key={std.id} className="hover:bg-[#252545]">
                <td className="p-4">{std.username}</td>
                <td className="p-4">{std.first_name} {std.last_name}</td>
                <td className="p-4">{std.grade}/{std.room}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 ${std.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'} text-black font-bold text-xs uppercase`}>
                    {std.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}