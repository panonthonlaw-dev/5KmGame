"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

/**
 * 📝 ฟังก์ชันคำนวณ Level และ Rank แบบขั้นบันได (Master's Logic)
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
  const [allUsers, setAllUsers] = useState<any[]>([]); 
  const [openMission, setOpenMission] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // ✨ [แทรกใหม่] ตัวแปรคุมมินิเกม
  const [lightIndex, setLightIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  const THEME = {
    จัดวาง: { โปรไฟล์_กว้าง: "480px", แถบเมนู_กว้าง: "480px", เนื้อหา_กว้าง: "480px", ความสูงรายการภารกิจ: "520px" },
    สี: { พื้นหลังการ์ด: "#fdfdfd", เน้น_แดง: "#FF001F", เน้น_ส้ม: "#FF3300", เน้น_น้ำเงิน: "#0066FF", เน้น_ฟ้า: "#1E90FF", เน้น_เขียว: "#10b981", เน้น_ม่วงEXP: "#8b5cf6", ข้อความ_ปกติ: "#1e3a8a", ข้อความ_จาง: "#94a3b8" }
  };

  // ✨ [แทรกใหม่] เอฟเฟกต์ไฟจราจรวิ่ง
  useEffect(() => {
    let timer: any;
    if (tab === 'game' && (isPlaying || isTraining)) {
      timer = setInterval(() => { setLightIndex(prev => (prev + 1) % 3); }, 120);
    }
    return () => clearInterval(timer);
  }, [tab, isPlaying, isTraining]);

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
  const stats = getPlayerStats(u.exp || 0);

  return (
    <main className="relative min-h-screen w-full flex flex-col p-4 bg-slate-50 overflow-hidden">
      <img src="/BG.png" className="fixed inset-0 w-full h-full object-cover z-0" alt="BG" />

      {/* Profile Section */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '180px', marginTop: '5px' }}>
                <p style={{ fontSize: '10px', color: THEME.สี.ข้อความ_จาง, fontWeight: 900 }}>{stats.expInCurrentLevel} / {stats.nextLevelExp} EXP</p>
                <p style={{ fontSize: '10px', color: '#EAB308', fontWeight: 900 }}>💰 {u.coins || 0} Gold</p>
            </div>
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
            <div key={t} onClick={() => { setTab(t); if(t === 'game') setIsPlaying(true); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: tab === t ? THEME.สี.เน้น_แดง : 'transparent', color: tab === t ? '#fff' : THEME.สี.เน้น_ฟ้า, borderRadius: '15px', fontWeight: 900, fontSize: '12px' }}>
              {t === 'mission' ? 'ภารกิจ' : t === 'shop' ? 'ร้านค้า' : t === 'game' ? 'เกม' : 'อันดับ'}
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: THEME.จัดวาง.เนื้อหา_กว้าง, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        
        {/* [1] Mission Tab */}
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

        {/* [2] Shop Tab (Mockup) */}
        {tab === 'shop' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
             {[1, 2, 3, 4].map(i => (
               <div key={i} style={{ backgroundColor: '#fff', borderRadius: '25px', padding: '20px', textAlign: 'center' }}>
                 <div style={{ width: '50px', height: '50px', background: '#eee', margin: '0 auto 10px', borderRadius: '10px' }}></div>
                 <p style={{ fontSize: '13px', fontWeight: 900 }}>Item {i}</p>
                 <p style={{ fontSize: '11px', color: '#EAB308' }}>💰 100 Gold</p>
                 <button onClick={() => Swal.fire('Coming Soon', 'ระบบร้านค้ากำลังพัฒนา', 'info')} style={{ marginTop: '10px', width: '100%', padding: '8px', background: THEME.สี.เน้น_ฟ้า, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '11px' }}>ซื้อ</button>
               </div>
             ))}
          </div>
        )}

        {/* [3] Game Tab (Traffic Stop) */}
        {tab === 'game' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '35px', padding: '40px 20px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontWeight: 900, color: THEME.สี.ข้อความ_ปกติ }}>Traffic Stop</h3>
            <div style={{ background: '#333', width: '70px', padding: '15px', borderRadius: '20px', margin: '20px auto', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ff0000', opacity: lightIndex === 0 ? 1 : 0.2, boxShadow: lightIndex === 0 ? '0 0 15px #ff0000' : 'none', transition: '0.1s' }}></div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffcc00', opacity: lightIndex === 1 ? 1 : 0.2, boxShadow: lightIndex === 1 ? '0 0 15px #ffcc00' : 'none', transition: '0.1s' }}></div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#00ff00', opacity: lightIndex === 2 ? 1 : 0.2, boxShadow: lightIndex === 2 ? '0 0 15px #00ff00' : 'none', transition: '0.1s' }}></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <button 
                disabled={!isPlaying}
                onClick={async () => {
                  if (u.last_spin) {
                    const lastDate = new Date(u.last_spin).getTime();
                    const hoursLeft = (lastDate + (24 * 60 * 60 * 1000) - new Date().getTime()) / (1000 * 60 * 60);
                    if (hoursLeft > 0) return Swal.fire({ title: 'ติดไฟแดง!', text: `รออีก ${Math.ceil(hoursLeft)} ชม.`, icon: 'info' });
                  }
                  setIsPlaying(false);
                  setIsTraining(false);
                  let prize = lightIndex === 2 ? 100 : lightIndex === 1 ? 30 : 10;
                  const { error } = await supabase.from('users').update({ coins: (u.coins || 0) + prize, last_spin: new Date().toISOString() }).eq('id', u.id);
                  if(!error) { 
                    Swal.fire({ title: 'STOP!', text: `คุณได้รับ ${prize} Gold`, icon: 'success' }); 
                    fetchData(u.id); 
                  }
                }}
                style={{ width: '200px', height: '55px', background: isPlaying ? '#333' : '#ccc', color: '#fff', borderRadius: '15px', fontWeight: 900, border: 'none' }}
              >
                {isPlaying ? 'STOP! ✋' : 'COOLDOWN'}
              </button>
              {!isPlaying && !isTraining && (
                <button onClick={() => setIsTraining(true)} style={{ background: 'none', border: '1px solid #0066FF', color: '#0066FF', padding: '5px 15px', borderRadius: '10px', fontSize: '11px' }}>ซ้อมเล่น</button>
              )}
              {isTraining && (
                <button onClick={() => { setIsTraining(false); Swal.fire('โหมดซ้อม', 'ไม่ได้รางวัลนะครับ', 'info'); }} style={{ width: '200px', height: '55px', background: '#0066FF', color: '#fff', borderRadius: '15px', fontWeight: 900, border: 'none' }}>STOP! (ซ้อม)</button>
              )}
            </div>
          </div>
        )}

        {/* [4] Rank Tab */}
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

      {/* ✨ [แทรกใหม่ 1/2] Loading Overlay สำหรับการอัพโหลด */}
      {isUploading && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '40px', boxShadow: '0 25px 60px rgba(0,0,0,0.1)', textAlign: 'center', width: '320px' }}>
            <div className="upload-rocket" style={{ fontSize: '60px', marginBottom: '20px' }}>🚀</div>
            <h3 style={{ fontWeight: 900, color: THEME.สี.ข้อความ_ปกติ, fontSize: '20px', margin: '0 0 10px 0' }}>กำลังส่งภารกิจ...</h3>
            <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '20px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, ${THEME.สี.เน้น_ฟ้า}, ${THEME.สี.เน้น_น้ำเงิน})`, transition: '0.4s' }}></div>
            </div>
            <p style={{ fontSize: '16px', fontWeight: 900, color: THEME.สี.เน้น_น้ำเงิน }}>{progress}%</p>
            <p style={{ fontSize: '12px', color: THEME.สี.ข้อความ_จาง, marginTop: '10px' }}>โปรดอย่าเพิ่งปิดหน้าจอนะครับ Master</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        
        /* ✨ [แทรกใหม่ 2/2] Animation สำหรับไอคอนจรวด */
        .upload-rocket {
          animation: rocket-bounce 1.5s infinite;
        }
        @keyframes rocket-bounce {
          0%, 100% { transform: translateY(0) rotate(-45deg); }
          50% { transform: translateY(-15px) rotate(-45deg); }
        }
      `}</style>
    </main>
  );
}