"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [จดจำเราไหม, setจดจำเราไหม] = useState(false);
  
  // 📝 ข้อมูลฟอร์มทั้งหมด
  const [f, setF] = useState({ 
    u: '', p: '', cp: '', sid: '', name: '', phone: '', grade: 'ม.1', room: '1' 
  });

  // ============================================================
  // 🎨 [MASTER CONFIG] - ปรับแต่งทุกอย่างที่นี่ (ภาษาไทย)
  // ============================================================
  const THEME = {
    // --- 🟢 หมวดหมู่สี (Colors) ---
    สีการ์ดกลางจอ: "#fdfdfd",        // สีขาวนวล (ทึบ)
    สีหัวข้อหลัก: "#FF001F",         // สีแดงสด (เล่น เปลี่ยน รอด)
    สีหัวข้อรอง: "#FF3300",          // สีส้มแดง (สโลแกน)
    สีข้อความนำ: "#1E90FF",         // สีชื่อช่องกรอก (Label)
    สีปุ่มล็อกอิน: "#0066FF",        // สีน้ำเงินสด (Sign In)
    สีปุ่มสร้างยูส: "#FF8800",       // สีส้มสด (Create/Register)
    สีตัวหนังสือบนปุ่ม: "#ffffff",     // สีขาว
    สีลิงก์ลืมรหัส: "#1E90FF",        // สีฟ้า

    // --- 🅰️ หมวดหมู่ตัวอักษร (Font Sizes) ---
    ขนาดหัวข้อหลัก: "44px",
    ขนาดสโลแกน: "10px",
    ขนาดข้อความนำ: "11px",
    ขนาดข้อความในช่องกรอก: "14px",
    ขนาดตัวหนังสือบนปุ่ม: "18px",
    ขนาดลิงก์ย้อนกลับ: "13px",

    // --- 📏 หมวดหมู่ระยะห่างและขนาด (Sizing & Spacing) ---
    ช่องไฟระหว่างบรรทัด: "30px",      // ระยะห่าง 30px ตามสั่ง
    ความกว้างการ์ด: "420px",
    ความกว้างปุ่ม: "240px",
    ความกว้างช่องกรอก: "320px",
    ความมนของขอบ: "9999px",         // ทรงแคปซูล
    
    // --- 🕒 ระบบความปลอดภัย (Security) ---
    เวลาล็อกเอาท์อัตโนมัติ: 600000,   // 10 นาที
  };

  // ============================================================
  // 🛡️ ระบบความปลอดภัยและจดจำรหัส (Security & Remember Me)
  // ============================================================
  
  // 1. ตรวจสอบการนิ่ง (Idle Timeout)
  useEffect(() => {
    const checkIdle = () => {
      const lastAct = localStorage.getItem('lastAct');
      if (lastAct && Date.now() - parseInt(lastAct) > THEME.เวลาล็อกเอาท์อัตโนมัติ) {
        localStorage.clear();
        alert("Master! ระบบล็อกเอาท์เนื่องจากไม่มีการใช้งานเกิน 10 นาทีครับ");
        window.location.reload();
      }
    };
    const interval = setInterval(checkIdle, 30000);
    return () => clearInterval(interval);
  }, []);

  // 2. ดึงข้อมูลที่จดจำไว้ (Load Remembered Credentials)
  useEffect(() => {
    const savedU = localStorage.getItem('remU');
    const savedP = localStorage.getItem('remP');
    if (savedU && savedP) {
      setF(prev => ({ ...prev, u: savedU, p: savedP }));
      setจดจำเราไหม(true);
    }
  }, []);

  // ============================================================
  // 🛠️ Logic การทำงาน (Login / Signup / Reset)
  // ============================================================

  // --- เข้าสู่ระบบ ---
  const handleLogin = async (e: any) => {
    e.preventDefault();
    
    // 1. ดึงข้อมูลจาก Supabase โดยเช็ค Username และ Password
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', f.u)
      .eq('password', f.p)
      .single();

    if (user) {
      // 2. ระบบจดจำรหัส (Remember Me)
      if (จดจำเราไหม) {
        localStorage.setItem('remU', f.u);
        localStorage.setItem('remP', f.p);
      } else {
        localStorage.removeItem('remU');
        localStorage.removeItem('remP');
      }

      // 3. เก็บข้อมูลผู้ใช้และเวลาที่ขยับล่าสุดลงเครื่อง (เพื่อระบบ Auto Logout 10 นาที)
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('lastAct', Date.now().toString());

      // 4. ✨ [จุดสำคัญ!] แยกเส้นทางตามตำแหน่ง (Role)
      if (user.role === 'admin') {
        alert(`ยินดีต้อนรับครับ Master ${user.name} (โหมดผู้ดูแล)`);
        router.push('/admin');    // ส่งไปหน้า Admin
      } else {
        alert(`สวัสดีครับคุณ ${user.name} (โหมดผู้เล่น)`);
        router.push('/dashboard'); // ส่งไปหน้าผู้เล่น
      }

    } else {
      alert("❌ ไม่พบผู้ใช้งานหรือรหัสผ่านผิดครับ Master!");
    }
  };

  // --- สมัครสมาชิก ---
  const handleSignup = async (e: any) => {
    e.preventDefault();
    if (f.u.length < 6 || f.u.length > 12) return alert("Username ต้อง 6-12 ตัวครับ");
    if (f.p.length < 6 || f.p.length > 12) return alert("Password ต้อง 6-12 ตัวครับ");
    if (f.p !== f.cp) return alert("ยืนยันรหัสผ่านไม่ตรงกันครับ");
    if (!/^(06|08|09)\d{8}$/.test(f.phone)) return alert("เบอร์โทรต้องขึ้นต้นด้วย 06,08,09 และมี 10 หลัก");
    
    const { error } = await supabase.from('users').insert([{ 
      username: f.u, password: f.p, name: f.name, student_id: f.sid, 
      phone: f.phone, grade: f.grade, room: f.room 
    }]);
    if (error) alert("Username นี้ถูกใช้งานแล้ว!");
    else { alert("สมัครสมาชิกสำเร็จ!"); setMode('login'); }
  };

  // --- ลืมรหัสผ่าน ---
  const handleReset = async (e: any) => {
    e.preventDefault();
    if (f.p !== f.cp) return alert("รหัสผ่านใหม่ไม่ตรงกัน!");
    const { data, error } = await supabase.from('users').update({ password: f.p })
      .match({ username: f.u, student_id: f.sid, phone: f.phone }).select();

    if (data && data.length > 0) {
      alert("✅ เปลี่ยนรหัสผ่านสำเร็จ!");
      setMode('login');
    } else alert("❌ ข้อมูลไม่ถูกต้อง ไม่สามารถเปลี่ยนรหัสได้");
  };

  // --- Reusable Styles ---
  const boxStyle = { marginBottom: THEME.ช่องไฟระหว่างบรรทัด, textAlign: 'center' as const };
  const labelStyle = { color: THEME.สีข้อความนำ, marginBottom: '10px', fontSize: THEME.ขนาดข้อความนำ, fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.2em', display: 'block' };
  const inputStyle = { width: THEME.ความกว้างช่องกรอก, height: '52px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: THEME.ความมนของขอบ, padding: '0 24px', color: '#1e3a8a', fontWeight: 700, outline: 'none', fontSize: THEME.ขนาดข้อความในช่องกรอก };
  const btnStyle = (bg: string) => ({ width: THEME.ความกว้างปุ่ม, height: '58px', backgroundColor: bg, color: THEME.สีตัวหนังสือบนปุ่ม, fontWeight: 900, borderRadius: THEME.ความมนของขอบ, border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: THEME.ขนาดตัวหนังสือบนปุ่ม, boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)' });

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-6">
      <img src="/BG.png" className="fixed inset-0 w-full h-full object-cover z-0" alt="Background" />

      <div style={{ position: 'relative', zIndex: 10, backgroundColor: THEME.สีการ์ดกลางจอ, width: '100%', maxWidth: THEME.ความกว้างการ์ด, padding: '70px 32px', borderRadius: '60px', boxShadow: '0 40px 100px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* หัวข้อโปรเจกต์ */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ color: THEME.สีหัวข้อหลัก, fontSize: THEME.ขนาดหัวข้อหลัก, fontWeight: 900, fontStyle: 'italic', margin: 0 }}>เล่น เปลี่ยน รอด</h1>
          <p style={{ color: THEME.สีหัวข้อรอง, fontWeight: 900, fontSize: THEME.ขนาดสโลแกน, textTransform: 'uppercase', letterSpacing: '0.4em', marginTop: '15px' }}>Traffic Game Center</p>
        </div>

        {/* --- 1. โหมดล็อกอิน (มีระบบจดจำพาส) --- */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col items-center w-full">
            <div style={boxStyle}><label style={labelStyle}>User Access</label><input style={inputStyle} value={f.u} onChange={e => setF({...f, u: e.target.value})} required /></div>
            <div style={boxStyle}><label style={labelStyle}>Password</label><input type="password" style={inputStyle} value={f.p} onChange={e => setF({...f, p: e.target.value})} required /></div>
            
            {/* ☑️ ระบบจดจำรหัสผ่าน */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
              <input type="checkbox" checked={จดจำเราไหม} onChange={e => setจดจำเราไหม(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <span style={{ fontSize: '13px', fontWeight: 900, color: THEME.สีข้อความนำ }}>จดจำรหัสผ่านไว้ในเครื่อง</span>
            </div>

            <button type="submit" style={btnStyle(THEME.สีปุ่มล็อกอิน)} className="hover:scale-105 active:scale-95">SIGN IN 🚀</button>
            <button type="button" onClick={() => setMode('signup')} style={{ ...btnStyle(THEME.สีปุ่มสร้างยูส), marginTop: '25px' }}>CREATE USER ✨</button>
            <span onClick={() => setMode('reset')} style={{ color: THEME.สีลิงก์ลืมรหัส, fontWeight: 900, fontSize: '12px', textDecoration: 'underline', marginTop: '30px', cursor: 'pointer' }}>ลืมรหัสผ่านใช่ไหม? (Forgot Password)</span>
          </form>
        )}

        {/* --- 2. โหมดสมัครสมาชิก (เช็คละเอียด) --- */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="flex flex-col items-center w-full overflow-y-auto max-h-[500px] px-2">
             <div style={boxStyle}><label style={labelStyle}>Username (6-12 ตัว)</label><input style={inputStyle} onChange={e => setF({...f, u: e.target.value.replace(/[^a-zA-Z0-9]/g, '')})} required /></div>
             <div style={boxStyle}><label style={labelStyle}>Password (6-12 ตัว)</label><input type="password" style={inputStyle} onChange={e => setF({...f, p: e.target.value.replace(/[^a-zA-Z0-9]/g, '')})} required /></div>
             <div style={boxStyle}><label style={labelStyle}>ยืนยันรหัสผ่าน</label><input type="password" style={inputStyle} onChange={e => setF({...f, cp: e.target.value})} required /></div>
             <div style={boxStyle}><label style={labelStyle}>ชื่อ-นามสกุล (ภาษาไทย)</label><input style={inputStyle} onChange={e => setF({...f, name: e.target.value.replace(/[0-9]/g, '')})} required /></div>
             <div style={boxStyle}><label style={labelStyle}>เบอร์โทร (10 หลัก)</label><input style={inputStyle} value={f.phone} onChange={e => setF({...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} required /></div>
             <div style={boxStyle}><label style={labelStyle}>รหัสนักเรียน</label><input style={inputStyle} onChange={e => setF({...f, sid: e.target.value.replace(/\D/g, '')})} required /></div>
             <div style={{ display: 'flex', gap: '20px', marginBottom: THEME.ช่องไฟระหว่างบรรทัด }}>
               <div><label style={labelStyle}>ชั้น</label><select style={{ ...inputStyle, width: '150px' }} onChange={e => setF({...f, grade: e.target.value})}>{[1,2,3,4,5,6].map(i => <option key={i} value={`ม.${i}`}>ม.{i}</option>)}</select></div>
               <div><label style={labelStyle}>ห้อง</label><select style={{ ...inputStyle, width: '150px' }} onChange={e => setF({...f, room: e.target.value})}>{Array.from({length: 15}, (_, i) => i + 1).map(i => <option key={i} value={i}>{i}</option>)}</select></div>
             </div>
             <button type="submit" style={btnStyle(THEME.สีปุ่มสร้างยูส)}>REGISTER NOW</button>
             <button type="button" onClick={() => setMode('login')} style={{ color: THEME.สีข้อความนำ, fontSize: THEME.ขนาดลิงก์ย้อนกลับ, textDecoration: 'underline', marginTop: '30px', border: 'none', background: 'none' }}>ย้อนกลับหน้าล็อกอิน</button>
          </form>
        )}

        {/* --- 3. โหมดลืมรหัสผ่าน (เช็คข้อมูล 3 จุด) --- */}
        {mode === 'reset' && (
          <form onSubmit={handleReset} className="flex flex-col items-center w-full overflow-y-auto max-h-[500px] px-2">
             <div style={boxStyle}><label style={labelStyle}>Username</label><input style={inputStyle} onChange={e => setF({...f, u: e.target.value})} required /></div>
             <div style={boxStyle}><label style={labelStyle}>รหัสนักเรียน</label><input style={inputStyle} onChange={e => setF({...f, sid: e.target.value})} required /></div>
             <div style={boxStyle}><label style={labelStyle}>เบอร์โทรที่สมัคร</label><input style={inputStyle} value={f.phone} onChange={e => setF({...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} required /></div>
             <hr style={{ width: '100%', border: '1px dashed #ddd', marginBottom: '30px' }} />
             <div style={boxStyle}><label style={labelStyle}>รหัสผ่านใหม่</label><input type="password" style={inputStyle} onChange={e => setF({...f, p: e.target.value})} required /></div>
             <div style={boxStyle}><label style={labelStyle}>ยืนยันรหัสผ่านใหม่</label><input type="password" style={inputStyle} onChange={e => setF({...f, cp: e.target.value})} required /></div>
             <button type="submit" style={btnStyle(THEME.สีปุ่มล็อกอิน)}>CHANGE PASSWORD</button>
             <button type="button" onClick={() => setMode('login')} style={{ color: THEME.สีข้อความนำ, fontSize: THEME.ขนาดลิงก์ย้อนกลับ, textDecoration: 'underline', marginTop: '30px', border: 'none', background: 'none' }}>ย้อนกลับหน้าล็อกอิน</button>
          </form>
        )}
      </div>
    </main>
  );
}