import { BrandWordmark } from '@/components/brand/BrandWordmark';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="mb-8">
        <BrandWordmark />
      </div>
      {children}
    </div>
  );
}
