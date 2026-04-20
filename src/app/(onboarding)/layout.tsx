export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="mb-8">
        <span className="text-2xl font-bold text-primary tracking-tight">Evoluteam</span>
      </div>
      {children}
    </div>
  );
}
