"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

/**
 * ============================================================
 * 🎨 EXTREME STYLE CONFIG (ปรับแต่งสไตล์อย่างละเอียดที่สุด)
 * ============================================================
 */
const STYLE = {
  สี: {
    // --- โทนหลัก ---
    เน้น_แดง: "#FF001F",         // สีปุ่มหลัก, ป้าย Admin, เส้นขอบเน้น
    เน้น_น้ำเงิน: "#0066FF",       // สี Tab ที่ไม่ได้เลือก, ชื่อภารกิจ
    เน้น_เขียว: "#10b981",        // สีปุ่มอนุมัติ, สถานะ Success
    เน้น_ทอง: "#f59e0b",         // สีตัวเลข EXP, ไอคอนอันดับ
    
    // --- พื้นหลัง & พื้นผิว ---
    พื้นหลัง_จาง: "#f8fafc",      // พื้นหลังช่อง Input, พื้นหลังการ์ดที่พับอยู่
    พื้นหลัง_ขาว: "#ffffff",      // พื้นหลังการ์ดหลัก
    พื้นหลัง_แดงจาง: "#fff1f2",    // พื้นหลังสถานะ Rejected/ไม่ผ่าน
    พื้นหลัง_เขียวจาง: "#f0fdf4",  // พื้นหลังสถานะ Approved/ผ่าน
    
    // --- เส้นขอบ & ตัวหนังสือ ---
    เส้นขอบ: "#e2e8f0",          // เส้นคั่นระหว่างรายการ, ขอบปุ่มปกติ
    ตัวหนังสือ_เข้ม: "#1e3a8a",    // หัวข้อหลัก, ชื่อนักเรียน (อ่านง่ายสุด)
    ตัวหนังสือ_จาง: "#64748b",    // คำอธิบายภารกิจ, วันที่, ข้อความเสริม
    ผิดพลาด: "#ef4444",          // สีป้าย "ไม่ผ่าน", ข้อความแจ้งเตือนพัง
  },
  
  ขนาด: {
    // --- โครงสร้างหลัก ---
    หน้าจอ_กว้าง: "850px",        // ความกว้างสูงสุดของเนื้อหาในหน้าจอ
    ระยะห่าง_บน: "20px",          // ระยะห่างจากขอบบนสุดของหน้าจอ
    ระยะห่าง_รายการ: "12px",      // ระยะห่างระหว่างแต่ละ Accordion
    
    // --- องค์ประกอบภายใน ---
    ความสูง_พรีวิวรูป: "280px",    // ความสูงของกรอบโชว์รูปในหน้าตรวจ (Contain)
    ความสูง_ปุ่มหลัก: "52px",     // ความสูงปุ่ม "บันทึก/ส่ง"
    ความสูง_ปุ่มย่อย: "42px",     // ความสูงปุ่ม "อนุมัติ/อัปเดต"
    ความสูง_ช่องInput: "48px",   // ความสูงของช่องกรอกข้อมูลทั้งหมด
    
    // --- ความโค้ง (Border Radius) ---
    โค้ง_การ์ดใหญ่: "35px",       // ความโค้งของ Card หลัก
    โค้ง_Accordion: "20px",     // ความโค้งของแถบรายการแต่ละคน
    โค้ง_ปุ่ม: "15px",           // ความโค้งของปุ่มกด
    โค้ง_รูป: "18px",            // ความโค้งของรูปภาพพรีวิว
  },
  
  ฟอนต์: {
    // --- ขนาดตัวหนังสือ ---
    ไซส์_หัวข้อใหญ่: "24px",      // ชื่อ Admin, หัวข้อ Tab
    ไซส์_หัวข้อย่อย: "17px",      // ชื่อนักเรียนในรายการ
    ไซส์_เนื้อหา: "14px",        // คำอธิบาย, ข้อมูล EXP
    ไซส์_ปุ่ม: "15px",           // ตัวหนังสือบนปุ่ม
    ไซส์_เล็กพิเศษ: "11px",      // ยศ Admin, สถานะตัวเล็กๆ
    
    // --- ความหนา ---
    หนา_พิเศษ: 900,             // สำหรับหัวข้อที่ต้องการเน้นมาก
    หนา_ปกติ: 500,               // สำหรับเนื้อหาทั่วไป
  },
  
  เอฟเฟกต์: {
    เงา_นุ่มนวล: "0 10px 40px rgba(0,0,0,0.06)", // เงาใต้การ์ดให้ดูมีมิติ
    ความเร็ว_อนิเมชั่น: "0.3s",   // ความเร็วเวลาหมุนลูกศร หรือกาง Accordion
    ความโปร่งแสง_Lightbox: 0.96, // ความมืดของพื้นหลังตอนกดดูรูปเต็มหน้าจอ
  }
};

export default function AdminPage() {
  const router = useRouter();
  const [u, setU] = useState<any>(null);
  const [tab, setTab] = useState<'review' | 'completed' | 'rank' | 'create' | 'manage' | 'add_staff'>('review');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  
  // การควบคุม Accordion (แยก ID กันชัดเจน)
  const [openReviewId, setOpenReviewId] = useState<string | null>(null);
  const [openCompletedId, setOpenCompletedId] = useState<string | null>(null);

  const [editingExp, setEditingExp] = useState<Record<string, string>>({});
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [f, setF] = useState({ id: '', title: '', desc: '', exp: '', u: '', p: '', name: '', role: 'assistant' });
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) { router.push('/'); return; }
    const userData = JSON.parse(saved);
    if (userData.role !== 'admin' && userData.role !== 'assistant') { router.push('/dashboard'); return; }
    setU(userData); fetchData();
  }, [router]);

  const fetchData = async () => {
    const { data: s } = await supabase.from('submissions').select('*, users(id, name, exp), missions(title, exp_reward, description)').order('created_at', { ascending: false });
    setSubmissions(s || []);
    const { data: m } = await supabase.from('missions').select('*').order('created_at', { ascending: false });
    setMissions(m || []);
    const { data: usr } = await supabase.from('users').select('*').eq('role', 'player').order('exp', { ascending: false });
    setAllUsers(usr || []);
  };

  const handleApprove = async (sub: any) => {
    await supabase.from('submissions').update({ status: 'approved' }).eq('id', sub.id);
    await supabase.from('users').update({ exp: (sub.users.exp || 0) + sub.missions.exp_reward }).eq('id', sub.users.id);
    
    // ✅ เปลี่ยนเป็น Swal (ลบ alert เดิมออกด้วยนะครับ)
    Swal.fire({
      title: 'อนุมัติเรียบร้อย!',
      text: `มอบ ${sub.missions.exp_reward} EXP ให้คุณ ${sub.users.name}`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });

    fetchData();
};

  const handleUpdateExp = async (userId: string) => {
    const newVal = editingExp[userId];
    
    // ❌ กรณีใส่ข้อมูลผิด
    if (!newVal || isNaN(parseInt(newVal))) {
      return Swal.fire({ 
        title: 'ใส่ตัวเลขเท่านั้น', 
        icon: 'error',
        confirmButtonColor: '#FF001F' 
      });
    }

    await supabase.from('users').update({ exp: parseInt(newVal) }).eq('id', userId);
    
    // ✅ กรณีอัปเดตสำเร็จ
    Swal.fire({
      title: 'อัปเดต EXP สำเร็จ!',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });

    fetchData();
};

  const commonInput = { width: '100%', height: STYLE.ขนาด.ความสูง_ช่องInput, background: STYLE.สี.พื้นหลัง_จาง, border: `1px solid ${STYLE.สี.เส้นขอบ}`, borderRadius: STYLE.ขนาด.โค้ง_ปุ่ม, padding: '0 15px', outline: 'none' };

  if (!u) return null;

  return (
    <main className="relative min-h-screen w-full p-4 flex flex-col items-center pb-20">
      <img src="/BG.png" className="fixed inset-0 w-full h-full object-cover z-0" alt="BG" />
      
      {/* 👑 หัวหน้าแอดมิน */}
      <div style={{ width: '100%', maxWidth: STYLE.ขนาด.หน้าจอ_กว้าง, position: 'relative', zIndex: 10, marginTop: STYLE.ขนาด.ระยะห่าง_บน }}>
        <div style={{ backgroundColor: STYLE.สี.พื้นหลัง_ขาว, borderRadius: STYLE.ขนาด.โค้ง_การ์ดใหญ่, padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: STYLE.เอฟเฟกต์.เงา_นุ่มนวล, border: `2px solid ${STYLE.สี.เน้น_แดง}` }}>
          <div>
            <div style={{ fontSize: STYLE.ฟอนต์.ไซส์_หัวข้อใหญ่, fontWeight: STYLE.ฟอนต์.หนา_พิเศษ, color: STYLE.สี.ตัวหนังสือ_เข้ม }}>{u.name}</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
              <span style={{ backgroundColor: STYLE.สี.เน้น_แดง, color: '#fff', padding: '3px 12px', borderRadius: '20px', fontSize: STYLE.ฟอนต์.ไซส์_เล็กพิเศษ, fontWeight: 700 }}>{u.role.toUpperCase()}</span>
              <span style={{ color: STYLE.สี.เน้น_น้ำเงิน, fontSize: STYLE.ฟอนต์.ไซส์_เล็กพิเศษ, alignSelf: 'center', fontWeight: 700 }}>ADMIN CONTROL</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <button onClick={() => { localStorage.clear(); router.push('/'); }} style={{ background: 'none', border: 'none', color: STYLE.สี.ตัวหนังสือ_จาง, fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>LOGOUT</button>
             <div style={{ width: '65px', height: '65px', borderRadius: '50%', border: `3px solid ${STYLE.สี.เน้น_แดง}`, overflow: 'hidden' }}>
               <img src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} className="w-full h-full object-cover" />
             </div>
          </div>
        </div>
      </div>

      {/* 🧭 แถบเมนู 6 TABS */}
      <div style={{ width: '100%', maxWidth: STYLE.ขนาด.หน้าจอ_กว้าง, position: 'relative', zIndex: 10, marginTop: '20px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '25px', padding: '6px', display: 'flex', boxShadow: STYLE.เอฟเฟกต์.เงา_นุ่มนวล, overflowX: 'auto' }}>
          {[
            { id: 'review', n: 'รอตรวจ' }, { id: 'completed', n: 'ตรวจแล้ว' }, { id: 'rank', n: 'อันดับ' },
            { id: 'create', n: 'สร้างงาน' }, { id: 'manage', n: 'จัดการ' }, { id: 'add_staff', n: 'ทีมงาน' }
          ].map(t => (
            <div key={t.id} onClick={() => setTab(t.id as any)} style={{ minWidth: '95px', flex: 1, padding: '15px 5px', textAlign: 'center', cursor: 'pointer', background: tab === t.id ? STYLE.สี.เน้น_แดง : 'transparent', color: tab === t.id ? '#fff' : STYLE.สี.เน้น_น้ำเงิน, borderRadius: '20px', transition: STYLE.เอฟเฟกต์.ความเร็ว_อนิเมชั่น, fontSize: STYLE.ฟอนต์.ไซส์_ปุ่ม, fontWeight: STYLE.ฟอนต์.หนา_พิเศษ }}>{t.n}</div>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: STYLE.ขนาด.หน้าจอ_กว้าง, marginTop: '20px', position: 'relative', zIndex: 10 }}>
        
        {/* [1] TAB: รอตรวจ (Accordion) */}
        {tab === 'review' && (
          <div style={{ background: '#fff', padding: '25px', borderRadius: STYLE.ขนาด.โค้ง_การ์ดใหญ่, boxShadow: STYLE.เอฟเฟกต์.เงา_นุ่มนวล }}>
            <h3 style={{ fontSize: STYLE.ฟอนต์.ไซส์_หัวข้อใหญ่, fontWeight: STYLE.ฟอนต์.หนา_พิเศษ, color: STYLE.สี.ตัวหนังสือ_เข้ม, marginBottom: '20px' }}>🔍 งานที่รอตรวจสอบ</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: STYLE.ขนาด.ระยะห่าง_รายการ }}>
              {submissions.filter(s => s.status === 'pending').map((s, idx) => (
                <div key={s.id} style={{ border: `1px solid ${STYLE.สี.เส้นขอบ}`, borderRadius: STYLE.ขนาด.โค้ง_Accordion, overflow: 'hidden' }}>
                  <div onClick={() => setOpenReviewId(openReviewId === s.id ? null : s.id)} style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: openReviewId === s.id ? STYLE.สี.พื้นหลัง_จาง : '#fff' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ fontSize: STYLE.ฟอนต์.ไซส์_หัวข้อย่อย, fontWeight: 900, color: STYLE.สี.เน้น_น้ำเงิน }}>{idx + 1}.</span>
                      <span style={{ fontSize: STYLE.ฟอนต์.ไซส์_หัวข้อย่อย, fontWeight: 900, color: STYLE.สี.ตัวหนังสือ_เข้ม }}>{s.users?.name}</span>
                      <span style={{ fontSize: STYLE.ฟอนต์.ไซส์_เนื้อหา, color: STYLE.สี.เน้น_น้ำเงิน, alignSelf: 'center' }}>({s.missions?.title})</span>
                    </div>
                    <span style={{ transform: openReviewId === s.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: STYLE.เอฟเฟกต์.ความเร็ว_อนิเมชั่น }}>▼</span>
                  </div>
                  {openReviewId === s.id && (
                    <div style={{ padding: '20px', borderTop: `1px solid ${STYLE.สี.เส้นขอบ}`, background: '#fff' }}>
                      <p style={{ fontSize: STYLE.ฟอนต์.ไซส์_เนื้อหา, color: STYLE.สี.ตัวหนังสือ_จาง, marginBottom: '15px' }}>{s.missions?.description}</p>
                      <div onClick={() => setSelectedImg(s.image_url)} style={{ width: '100%', height: STYLE.ขนาด.ความสูง_พรีวิวรูป, background: STYLE.สี.พื้นหลัง_จาง, borderRadius: STYLE.ขนาด.โค้ง_รูป, overflow: 'hidden', cursor: 'zoom-in', border: `1px solid ${STYLE.สี.เส้นขอบ}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={`https://drive.google.com/thumbnail?id=${s.image_url.split('id=')[1]}&sz=w800`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="P" onError={(e:any) => e.target.src = s.image_url} />
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button onClick={() => handleApprove(s)} style={{ flex: 1, height: STYLE.ขนาด.ความสูง_ปุ่มย่อย, background: STYLE.สี.เน้น_เขียว, color: '#fff', border: 'none', borderRadius: STYLE.ขนาด.โค้ง_ปุ่ม, fontWeight: 900 }}>อนุมัติ ✅</button>
                        <button onClick={async () => { await supabase.from('submissions').update({status:'rejected'}).eq('id',s.id); fetchData(); }} style={{ flex: 1, height: STYLE.ขนาด.ความสูง_ปุ่มย่อย, background: STYLE.สี.พื้นหลัง_แดงจาง, color: STYLE.สี.ผิดพลาด, border: 'none', borderRadius: STYLE.ขนาด.โค้ง_ปุ่ม, fontWeight: 900 }}>ปฏิเสธ ❌</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* [2] TAB: ตรวจแล้ว (Accordion พับได้ตามคำขอ) */}
        {tab === 'completed' && (
          <div style={{ background: '#fff', padding: '25px', borderRadius: STYLE.ขนาด.โค้ง_การ์ดใหญ่, boxShadow: STYLE.เอฟเฟกต์.เงา_นุ่มนวล }}>
            <h3 style={{ fontSize: STYLE.ฟอนต์.ไซส์_หัวข้อใหญ่, fontWeight: STYLE.ฟอนต์.หนา_พิเศษ, color: STYLE.สี.เน้น_เขียว, marginBottom: '20px' }}>✅ ตรวจเรียบร้อย (ปรับ EXP ได้)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: STYLE.ขนาด.ระยะห่าง_รายการ }}>
              {submissions.filter(s => s.status !== 'pending').map((s) => (
                <div key={s.id} style={{ border: `1px solid ${STYLE.สี.เส้นขอบ}`, borderRadius: STYLE.ขนาด.โค้ง_Accordion, overflow: 'hidden' }}>
                  {/* หัวข้อกดเปิด/ปิด */}
                  <div onClick={() => setOpenCompletedId(openCompletedId === s.id ? null : s.id)} style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: s.status === 'approved' ? STYLE.สี.พื้นหลัง_เขียวจาง : STYLE.สี.พื้นหลัง_แดงจาง }}>
                    <div>
                      <span style={{ fontSize: STYLE.ฟอนต์.ไซส์_หัวข้อย่อย, fontWeight: 900, color: STYLE.สี.ตัวหนังสือ_เข้ม }}>{s.users?.name}</span>
                      <span style={{ fontSize: STYLE.ฟอนต์.ไซส์_เนื้อหา, color: STYLE.สี.ตัวหนังสือ_จาง, marginLeft: '10px' }}>- {s.missions?.title}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 900, color: s.status === 'approved' ? STYLE.สี.เน้น_เขียว : STYLE.สี.ผิดพลาด }}>{s.status.toUpperCase()}</span>
                      <span style={{ transform: openCompletedId === s.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: STYLE.เอฟเฟกต์.ความเร็ว_อนิเมชั่น }}>▼</span>
                    </div>
                  </div>
                  {/* ส่วนที่ซ่อนไว้: แก้ไข EXP */}
                  {openCompletedId === s.id && (
                    <div style={{ padding: '20px', background: '#fff', borderTop: `1px solid ${STYLE.สี.เส้นขอบ}` }}>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: STYLE.สี.พื้นหลัง_จาง, padding: '15px', borderRadius: '15px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '10px', fontWeight: 900, color: STYLE.สี.ตัวหนังสือ_จาง }}>EXP ปัจจุบัน:</div>
                          <div style={{ fontSize: '18px', fontWeight: 900, color: STYLE.สี.เน้น_ทอง }}>{s.users?.exp}</div>
                        </div>
                        <div style={{ flex: 2 }}>
                          <input type="number" placeholder="ค่าใหม่..." style={commonInput} value={editingExp[s.users?.id] || ''} onChange={(e) => setEditingExp({...editingExp, [s.users?.id]: e.target.value})} />
                        </div>
                        <button onClick={() => handleUpdateExp(s.users?.id)} style={{ padding: '0 20px', height: STYLE.ขนาด.ความสูง_ปุ่มย่อย, background: STYLE.สี.เน้น_น้ำเงิน, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 900 }}>อัปเดต</button>
                        <button onClick={async () => { if(confirm('ตีกลับ?')) { await supabase.from('submissions').update({status:'pending'}).eq('id', s.id); fetchData(); } }} style={{ height: STYLE.ขนาด.ความสูง_ปุ่มย่อย, padding: '0 10px', background: '#e2e8f0', borderRadius: '10px' }}>🔄</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* [3-6] TAB อื่นๆ (ครบถ้วน) */}
        {tab === 'rank' && (
          <div style={{ background: '#fff', padding: '30px', borderRadius: STYLE.ขนาด.โค้ง_การ์ดใหญ่, boxShadow: STYLE.เอฟเฟกต์.เงา_นุ่มนวล }}>
            <h3 style={{ fontSize: STYLE.ฟอนต์.ไซส์_หัวข้อใหญ่, fontWeight: 900, textAlign: 'center', marginBottom: '25px', color: STYLE.สี.เน้น_น้ำเงิน }}>🏆 ลำดับคะแนนสูงสุด</h3>
            {allUsers.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: `1px solid ${STYLE.สี.เส้นขอบ}` }}>
                <span style={{ fontSize: STYLE.ฟอนต์.ไซส์_หัวข้อย่อย, fontWeight: 900 }}>{i+1}. {p.name}</span>
                <span style={{ fontSize: STYLE.ฟอนต์.ไซส์_หัวข้อย่อย, fontWeight: 900, color: STYLE.สี.เน้น_ทอง }}>{p.exp || 0} EXP</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'create' && (
          <div style={{ background: '#fff', padding: '40px', borderRadius: STYLE.ขนาด.โค้ง_การ์ดใหญ่, boxShadow: STYLE.เอฟเฟกต์.เงา_นุ่มนวล }}>
            <h3 style={{ fontSize: STYLE.ฟอนต์.ไซส์_หัวข้อใหญ่, fontWeight: 900, marginBottom: '25px' }}>{isEdit ? '📝 แก้ไขภารกิจ' : '➕ สร้างภารกิจใหม่'}</h3>
            <input placeholder="ชื่อภารกิจ" style={{...commonInput, marginBottom: '15px'}} value={f.title} onChange={e => setF({...f, title: e.target.value})} />
            <textarea placeholder="คำอธิบาย..." style={{...commonInput, height: '140px', paddingTop: '15px', marginBottom: '15px'}} value={f.desc} onChange={e => setF({...f, desc: e.target.value})} />
            <input placeholder="รางวัล EXP" style={{...commonInput, marginBottom: '25px'}} value={f.exp} onChange={e => setF({...f, exp: e.target.value.replace(/\D/g, '')})} />
            <button 
               onClick={async () => {
                 const payload = { title: f.title, description: f.desc, exp_reward: parseInt(f.exp) };
                 if (isEdit) await supabase.from('missions').update(payload).eq('id', f.id);
                 else await supabase.from('missions').insert([payload]);
                 alert('บันทึกสำเร็จ!'); setF({id:'',title:'',desc:'',exp:'',u:'',p:'',name:'',role:''}); setIsEdit(false); setTab('manage'); fetchData();
               }} 
               style={{ width: '100%', height: STYLE.ขนาด.ความสูง_ปุ่มหลัก, background: STYLE.สี.เน้น_น้ำเงิน, color: '#fff', border: 'none', borderRadius: '99px', fontWeight: 900 }}
            >
               ยืนยันบันทึก 🚀
            </button>
          </div>
        )}

        {tab === 'manage' && (
          <div style={{ background: '#fff', padding: '30px', borderRadius: STYLE.ขนาด.โค้ง_การ์ดใหญ่, boxShadow: STYLE.เอฟเฟกต์.เงา_นุ่มนวล }}>
            <h3 style={{ fontSize: STYLE.ฟอนต์.ไซส์_หัวข้อใหญ่, fontWeight: 900, marginBottom: '25px' }}>⚙️ รายชื่อภารกิจทั้งหมด</h3>
            {missions.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '18px', background: STYLE.สี.พื้นหลัง_จาง, borderRadius: '20px', marginBottom: '10px' }}>
                <div><div style={{ fontWeight: 900 }}>{m.title}</div><div style={{ color: STYLE.สี.เน้น_น้ำเงิน, fontSize: '11px' }}>+{m.exp_reward} EXP</div></div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setF({id:m.id, title:m.title, desc:m.description, exp:m.exp_reward.toString(), u:'', p:'', name:'', role:''}); setIsEdit(true); setTab('create'); }} style={{ padding: '8px 15px', background: STYLE.สี.เน้น_น้ำเงิน, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '11px' }}>แก้ไข</button>
                  <button onClick={async () => { if(confirm('ลบ?')) { await supabase.from('missions').delete().eq('id', m.id); fetchData(); } }} style={{ padding: '8px 15px', background: STYLE.สี.เน้น_แดง, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '11px' }}>ลบ</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'add_staff' && (
          <div style={{ background: '#fff', padding: '40px', borderRadius: STYLE.ขนาด.โค้ง_การ์ดใหญ่, boxShadow: STYLE.เอฟเฟกต์.เงา_นุ่มนวล }}>
            <h3 style={{ fontSize: STYLE.ฟอนต์.ไซส์_หัวข้อใหญ่, fontWeight: 900, marginBottom: '25px' }}>👤 ลงทะเบียนทีมงาน</h3>
            <input placeholder="Username" style={{...commonInput, marginBottom: '15px'}} onChange={e => setF({...f, u: e.target.value})} />
            <input placeholder="Password" style={{...commonInput, marginBottom: '15px'}} onChange={e => setF({...f, p: e.target.value})} />
            <input placeholder="ชื่อแสดงผล" style={{...commonInput, marginBottom: '15px'}} onChange={e => setF({...f, name: e.target.value})} />
            <select style={{...commonInput, marginBottom: '25px'}} onChange={e => setF({...f, role: e.target.value})}>
              <option value="assistant">Assistant (ผู้ช่วย)</option>
              <option value="admin">Admin (แอดมิน)</option>
            </select>
            <button onClick={async () => { await supabase.from('users').insert([{username:f.u, password:f.p, name:f.name, role:f.role, role_type: 'admin'}]); alert('เพิ่มสำเร็จ!'); fetchData(); setTab('review'); }} style={{ width: '100%', height: STYLE.ขนาด.ความสูง_ปุ่มหลัก, background: STYLE.สี.เน้น_แดง, color: '#fff', border: 'none', borderRadius: '99px', fontWeight: 900 }}>เพิ่มทีมงาน 👥</button>
          </div>
        )}

      </div>

      {/* 🔍 ดูรูปเต็มหน้าจอ */}
      {selectedImg && (
        <div onClick={() => setSelectedImg(null)} style={{ position: 'fixed', inset: 0, background: `rgba(0,0,0,${STYLE.เอฟเฟกต์.ความโปร่งแสง_Lightbox})`, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <img src={selectedImg} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '15px' }} alt="F" />
        </div>
      )}
    </main>
  );
}