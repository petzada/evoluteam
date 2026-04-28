import { signOut } from '@/features/auth/actions';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
import { Button } from '@/components/ui/button';

export default function ContaSuspensaPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <BrandWordmark />
        <div className="rounded-xl border bg-card p-8 shadow-card space-y-4">
          <h1 className="text-lg font-semibold">Conta suspensa</h1>
          <p className="text-sm text-muted-foreground">
            Sua conta está temporariamente suspensa. Entre em contato com o suporte.
          </p>
          <form action={signOut}>
            <Button type="submit" variant="outline" className="w-full">
              Sair
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
