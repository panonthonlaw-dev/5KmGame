"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';


export default function DashboardPage() {
  const router = useRouter();
  const [u, setU] = useState<any>(null);
  const [tab, setTab] = useState<'mission' | 'shop' | 'game' | 'rank'>('mission');
  const [missions, setMissions] = useState<any[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);
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
  };

  const handleUpload = async (missionId: string) => {
    if (!selectedFile) return alert("❌ โปรดเลือกรูปภาพก่อนครับ");
    setIsUploading(true); setProgress(10);

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
          alert("🎉 ส่งภารกิจสำเร็จ!");
          setOpenMission(null); setSelectedFile(null); fetchData(u.id);
        }, 500);
      };
    } catch (err: any) {
      alert("❌ เกิดข้อผิดพลาด: " + err.message);
      setIsUploading(false);
    }
  };

  if (!u) return null;

  return (
    <main className="relative min-h-screen w-full flex flex-col p-4 bg-slate-50 overflow-hidden">
      <img src="/BG.png" className="fixed inset-0 w-full h-full object-cover z-0" alt="BG" />

      {/* Profile Section */}
      <div style={{ width: '100%', maxWidth: THEME.จัดวาง.โปรไฟล์_กว้าง, margin: '20px auto', position: 'relative', zIndex: 10 }}>
        <div style={{ backgroundColor: THEME.สี.พื้นหลังการ์ด, borderRadius: '35px', padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: THEME.สี.ข้อความ_ปกติ, margin: 0 }}>{u.name}</h2>
            <p style={{ color: THEME.สี.เน้น_ส้ม, fontWeight: 900, marginTop: '5px' }}>Lv.{u.level || 1}</p>
            <div style={{ width: '150px', height: '8px', background: '#eee', borderRadius: '10px', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${((u.exp || 0) % 1000) / 10}%`, height: '100%', background: THEME.สี.เน้น_ม่วงEXP, transition: '1s' }}></div>
            </div>
            <p style={{ fontSize: '10px', color: THEME.สี.เน้น_ม่วงEXP, marginTop: '5px', fontWeight: 900 }}>{u.exp || 0} / 1000 EXP</p>
          </div>
          <div style={{ width: '85px', height: '85px', borderRadius: '50%', border: `4px solid ${THEME.สี.เน้น_แดง}`, overflow: 'hidden' }}>
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

      {/* Missions Content (Scrollable) */}
      <div style={{ width: '100%', maxWidth: THEME.จัดวาง.เนื้อหา_กว้าง, margin: '0 auto', position: 'relative', zIndex: 10 }}>
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
                      {status === 'rejected' && <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '12px', fontSize: '11px', fontWeight: 900, textAlign: 'center' }}>❌ ไม่ผ่าน: กรุณาส่งรูปใหม่</div>}
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
