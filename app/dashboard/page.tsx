"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

/**
 * 📝 [เพิ่มใหม่] ฟังก์ชันคำนวณ Level และ Rank แบบขั้นบันได
 * สูตร: 1-10 (60/lv), 11-20 (100/lv), 21-30 (140/lv)
 */
const getPlayerStats = (totalExp: number) => {
  let lv = 1;
  let progressPercent = 0;
  let expInCurrentLevel = 0;
  let nextLevelExp = 100;
  const currentExp = totalExp || 0;

  if (currentExp < 600) {
    lv = Math.floor(currentExp / 60) + 1;
    expInCurrentLevel = currentExp % 60;
    nextLevelExp = 60;
    progressPercent = (expInCurrentLevel / 60) * 100;
  } else if (currentExp < 1600) {
    const remainingExp = currentExp - 600;
    lv = 10 + Math.floor(remainingExp / 100) + 1;
    expInCurrentLevel = remainingExp % 100;
    nextLevelExp = 100;
    progressPercent = expInCurrentLevel;
  } else {
    const remainingExp = currentExp - 1600;
    lv = 20 + Math.floor(remainingExp / 140) + 1;
    expInCurrentLevel = remainingExp % 140;
    nextLevelExp = 140;
    progressPercent = (expInCurrentLevel / 140) * 100;
  }

  const currentLevel = lv >= 30 ? 30 : lv;
  if (lv >= 30) progressPercent = 100;

  let rankName = "Beginner";
  let rankColor = "#94a3b8"; 
  if (currentLevel >= 28) { rankName = "Legend"; rankColor = "#f59e0b"; }
  else if (currentLevel >= 21) { rankName = "Expert"; rankColor = "#8b5cf6"; }
  else if (currentLevel >= 13) { rankName = "Skilled"; rankColor = "#0066FF"; }
  else if (currentLevel >= 6) { rankName = "Amateur"; rankColor = "#10b981"; }

  return { currentLevel, progressPercent, rankName, rankColor, expInCurrentLevel, nextLevelExp };
};

export default function DashboardPage() {
  const router = useRouter();
  const [u, setU] = useState<any>(null);
  const [tab, setTab] = useState<'mission' | 'shop' | 'game' | 'rank'>('mission');
  const [missions, setMissions] = useState<any[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]); // [เพิ่มใหม่] เก็บรายชื่อคนในอันดับ
  const [openMission, setOpenMission] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const THEME = {
    จัดวาง: { โปรไฟล์_กว้าง: "480px", แถบเมนู_กว้าง: "480px", เนื้อหา_กว้าง: "480px", ความสูงรายการภารกิจ: "520px" },
    สี: { พื้นหลังการ์ด: "#fdfdfd", เน้น_แดง: "#FF001F", เน้น_ส้ม: "#FF3300", เน้น_น้ำเงิน: "#0066FF", เน้น_ฟ้า: "#1E90FF", เน้น_เขียว: "#10b981", เน้น_ม่วงEXP: "#8b5cf6", ข้อความ_ปกติ: "#1e3a8a", ข้อความ_จาง: "#94a3b8" }
  };

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) { router.push('/'); return; }
    const userData = JSON.parse(saved);
    setU(userData);
    fetchData(userData.id);
  }, [router]);

  const fetchData = async (userId: string) => {
    const { data: mData } = await supabase.from('missions').select('*').order('created_at', { ascending: false });
    setMissions(mData || []);
    const { data: sData } = await supabase.from('submissions').select('*').eq('user_id', userId);
    setUserSubmissions(sData || []);
    const { data: uData } = await supabase.from('users').select('*').eq('id', userId).single();
    if (uData) { setU(uData); localStorage.setItem('user', JSON.stringify(uData)); }
    
    // [เพิ่มใหม่] ดึงข้อมูลอันดับ
    const { data: rankData } = await supabase.from('users').select('name, exp, avatar_url').order('exp', { ascending: false }).limit(10);
    setAllUsers(rankData || []);
  };

  const handleUpload = async (missionId: string) => {
    if (!selectedFile) {
        return Swal.fire({ 
            title: 'ลืมรูปภาพ!', 
            text: 'โปรดเลือกรูปก่อนครับ', 
            icon: 'warning',
            confirmButtonColor: '#0066FF'
        });
    }
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        setProgress(40);

        const res = await fetch('/api/upload-drive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: `TGC_${u.name}_M${missionId}_${Date.now()}`,
            mimeType: selectedFile.type,
            base64Data: base64Data
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const googleDriveUrl = `https://drive.google.com/uc?id=${data.fileId}`;
        setProgress(80);

        const existingSub = userSubmissions.find(s => s.mission_id === missionId);
        if (existingSub && existingSub.status === 'rejected') {
          await supabase.from('submissions').update({ status: 'pending', image_url: googleDriveUrl, created_at: new Date() }).eq('id', existingSub.id);
        } else {
          await supabase.from('submissions').insert([{ user_id: u.id, mission_id: missionId, status: 'pending', image_url: googleDriveUrl }]);
        }

        setProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          Swal.fire({ title: 'สำเร็จ!', text: 'ส่งภารกิจเรียบร้อย', icon: 'success', timer: 1500, showConfirmButton: false });
          setOpenMission(null); 
          setSelectedFile(null); 
          fetchData(u.id);
          setProgress(0);
        }, 500);
      };
    } catch (err: any) {
      Swal.fire({ title: 'เกิดข้อผิดพลาด', text: err.message, icon: 'error' });
      setIsUploading(false);
    }
  };

  if (!u) return null;
  // ✨ [เพิ่มใหม่] คำนวณค่าพลัง
  const stats = getPlayerStats(u.exp || 0);

  return (
    <main className="relative min-h-screen w-full flex flex-col p-4 bg-slate-50 overflow-hidden">
      <img src="/BG.png" className="fixed inset-0 w-full h-full object-cover z-0" alt="BG" />

      {/* Profile Section [อัปเดตระบบ Rank] */}
      <div style={{ width: '100%', maxWidth: THEME.จัดวาง.โปรไฟล์_กว้าง, margin: '20px auto', position: 'relative', zIndex: 10 }}>
        <div style={{ backgroundColor: THEME.สี.พื้นหลังการ์ด, borderRadius: '35px', padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: `2px solid ${stats.rankColor}` }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 900, color: THEME.สี.ข้อความ_ปกติ, margin: 0 }}>{u.name}</h2>
                <span style={{ backgroundColor: stats.rankColor, color: '#fff', fontSize: '10px', padding: '2px 10px', borderRadius: '20px', fontWeight: 900 }}>{stats.rankName}</span>
            </div>
            <p style={{ color: stats.rankColor, fontWeight: 900, marginTop: '5px', fontSize: '18px' }}>Lv.{stats.currentLevel}</p>
            <div style={{ width: '150px', height: '8px', background: '#eee', borderRadius: '10px', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${stats.progressPercent}%`, height: '100%', background: stats.rankColor, transition: '1s' }}></div>
            </div>
            <p style={{ fontSize: '10px', color: THEME.สี.ข้อความ_จาง, marginTop: '5px', fontWeight: 900 }}>{stats.expInCurrentLevel} / {stats.nextLevelExp} EXP (Total: {u.exp || 0})</p>
          </div>
          <div style={{ width: '85px', height: '85px', borderRadius: '50%', border: `4px solid ${stats.rankColor}`, overflow: 'hidden', backgroundColor: '#fff' }}>
            <img src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ width: '100%', maxWidth: THEME.จัดวาง.แถบเมนู_กว้าง, margin: '0 auto 20px auto', position: 'relative', zIndex: 10 }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '6px', display: 'flex', height: '60px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
          {['mission', 'shop', 'game', 'rank'].map((t: any) => (
            <div key={t} onClick={() => setTab(t)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: tab === t ? THEME.สี.เน้น_แดง : 'transparent', color: tab === t ? '#fff' : THEME.สี.เน้น_ฟ้า, borderRadius: '15px', fontWeight: 900, fontSize: '12px' }}>
              {t === 'mission' ? 'ภารกิจ' : t === 'shop' ? 'ร้านค้า' : t === 'game' ? 'เกม' : 'อันดับ'}
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: THEME.จัดวาง.เนื้อหา_กว้าง, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        {/* TAB: ภารกิจ */}
        {tab === 'mission' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: THEME.จัดวาง.ความสูงรายการภารกิจ, overflowY: 'auto', paddingRight: '8px' }} className="custom-scroll">
            {missions.map((m, i) => {
              const sub = userSubmissions.find(s => s.mission_id === m.id);
              const status = sub ? sub.status : 'none';
              return (
                <div key={m.id} style={{ backgroundColor: '#fff', borderRadius: '25px', padding: '22px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                  <div onClick={() => !isUploading && setOpenMission(openMission === m.id ? null : m.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ width: '32px', height: '32px', backgroundColor: status === 'approved' ? THEME.สี.เน้น_เขียว : THEME.สี.เน้น_แดง, borderRadius: '10px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                        {status === 'approved' ? '✓' : status === 'rejected' ? '!' : i + 1}
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: 900, color: THEME.สี.ข้อความ_ปกติ, margin: 0 }}>{m.title}</h3>
                    </div>
                    <span style={{ transform: openMission === m.id ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.3s', color: THEME.สี.เน้น_ฟ้า }}>❯</span>
                  </div>
                  {openMission === m.id && (
                    <div style={{ marginTop: '18px', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                      {status === 'pending' && <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#fffbeb', color: '#b45309', borderRadius: '12px', fontSize: '11px', fontWeight: 900, textAlign: 'center' }}>⏳ อยู่ระหว่างตรวจสอบ</div>}
                      {status === 'approved' && <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#ecfdf5', color: THEME.สี.เน้น_เขียว, borderRadius: '12px', fontSize: '11px', fontWeight: 900, textAlign: 'center' }}>✅ ภารกิจเรียบร้อย</div>}
                      {status === 'rejected' && <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '12px', fontSize: '11px', fontWeight: 900, textAlign: 'center' }}>❌ ไม่ผ่าน: {sub?.reason || 'กรุณาส่งรูปใหม่'}</div>}
                      <p style={{ fontSize: '13px', color: THEME.สี.ข้อความ_จาง, lineHeight: '1.6', marginBottom: '15px' }}>{m.description}</p>
                      {(status === 'none' || status === 'rejected') && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <label style={{ width: '100%', height: '110px', border: '2px dashed #e2e8f0', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <span style={{ fontSize: '12px', color: THEME.สี.ข้อความ_จาง, fontWeight: 900 }}>{selectedFile ? selectedFile.name : '📸 แตะเพื่อเลือกรูปภาพ'}</span>
                            <input type="file" accept="image/*" onChange={(e:any) => setSelectedFile(e.target.files[0])} style={{ display: 'none' }} />
                          </label>
                          <button onClick={() => handleUpload(m.id)} style={{ background: THEME.สี.เน้น_น้ำเงิน, color: '#fff', height: '48px', border: 'none', borderRadius: '18px', fontWeight: 900, cursor: 'pointer' }}>
                            {isUploading ? `กำลังส่ง... ${progress}%` : 'ส่งภารกิจ 🚀'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* [เพิ่มใหม่] TAB: อันดับ */}
        {tab === 'rank' && (
           <div style={{ backgroundColor: '#fff', borderRadius: '30px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: THEME.สี.ข้อความ_ปกติ, textAlign: 'center', marginBottom: '20px' }}>🏆 อันดับ Masters</h3>
              {allUsers.map((user, i) => {
                const s = getPlayerStats(user.exp || 0);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: 900, color: THEME.สี.เน้น_ส้ม, width: '25px' }}>{i + 1}</span>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${s.rankColor}` }}>
                        <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '14px' }}>{user.name}</p>
                        <span style={{ fontSize: '9px', color: s.rankColor, fontWeight: 900 }}>{s.rankName} (Lv.{s.currentLevel})</span>
                      </div>
                    </div>
                    <span style={{ fontWeight: 900, color: THEME.สี.เน้น_น้ำเงิน, fontSize: '14px' }}>{user.exp || 0} EXP</span>
                  </div>
                );
              })}
           </div>
        )}
      </div>

      <div style={{ width: '100%', textAlign: 'center', padding: '30px 0', zIndex: 10 }}>
        <span onClick={() => { localStorage.clear(); router.push('/'); }} style={{ color: THEME.สี.ข้อความ_จาง, fontSize: '12px', fontWeight: 900, textDecoration: 'underline', cursor: 'pointer' }}>LOGOUT SYSTEM</span>
      </div>

      <style jsx>{`
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </main>
  );
}