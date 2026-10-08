export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
      <div className="text-6xl font-bold text-[#af915f] num">404</div>
      <p className="text-muted-foreground">الصفحة غير موجودة</p>
      <a href="/" className="text-sm text-primary underline">
        العودة إلى لوحة القيادة
      </a>
    </div>
  );
}
