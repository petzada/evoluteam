import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, Mail, Layers, CheckCircle2, Circle, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getDashboardKpis } from '@/features/employees/queries';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, full_name')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) redirect('/onboarding/criar-empresa');

  const kpis = await getDashboardKpis(profile.company_id);
  const firstName = profile.full_name.split(' ')[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Olá, {firstName}.</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bem-vindo ao Evoluteam.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Colaboradores ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpis.activeEmployees}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Convites pendentes</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpis.pendingInvites}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Departamentos</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpis.departments}</p>
          </CardContent>
        </Card>
      </div>

      {/* Checklist primeiros passos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Primeiros passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm text-muted-foreground line-through">Criar empresa</span>
          </div>
          <div className="flex items-center gap-3">
            <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
            <Link href="/colaboradores" className="text-sm hover:underline">
              Convidar colaboradores
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
            <Link href="/configuracoes/departamentos" className="text-sm hover:underline">
              Definir departamentos
            </Link>
          </div>
          <div className="flex items-center gap-3 opacity-50">
            <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">Criar primeiro ciclo de avaliação — Em breve</span>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Dashboard completo em breve. Quando você tiver ciclos de avaliação ativos, métricas aparecerão aqui.
      </p>
    </div>
  );
}
