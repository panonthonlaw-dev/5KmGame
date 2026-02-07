import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. รับข้อมูล Base64 และชื่อไฟล์ที่ส่งมาจากหน้า Dashboard
    const body = await req.json(); 

    // 2. ตรวจสอบว่ามี URL ของ GAS ใน .env.local หรือยัง
    const gasUrl = process.env.GAS_WEB_APP_URL;
    if (!gasUrl) {
      throw new Error('ยังไม่ได้ตั้งค่า GAS_WEB_APP_URL ใน .env.local ครับ');
    }

    // 3. ส่งข้อมูลต่อไปยัง Google Apps Script (GAS)
    const gasRes = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: body.fileName,
        mimeType: body.mimeType,
        base64Data: body.base64Data,
        folderId: process.env.GOOGLE_DRIVE_FOLDER_ID // ส่ง Folder ID ไปด้วยเพื่อความชัวร์
      }),
    });

    const result = await gasRes.json();

    // 4. ถ้า GAS ส่ง Error กลับมา
    if (result.status === 'error') {
      throw new Error(result.message);
    }

    // 5. ส่ง File ID ที่ได้จาก Drive กลับไปให้หน้าบ้านเพื่อบันทึกลง Supabase
    return NextResponse.json({ 
      success: true, 
      fileId: result.fileId 
    });

  } catch (error: any) {
    console.error('❌ API Upload Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message }, 
      { status: 500 }
    );
  }
}