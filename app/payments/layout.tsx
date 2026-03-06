import { Suspense } from "react";

export default function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white/70">Loading...</div>}>
      {children}
    </Suspense>
  );
}
