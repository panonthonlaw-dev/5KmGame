import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      {/* ⚠️ ต้องเป็น bg-transparent เท่านั้น ห้ามมี bg-white หรือคลาสสีอื่น */}
      <body className="bg-transparent">
        {children}
      </body>
    </html>
  )
}