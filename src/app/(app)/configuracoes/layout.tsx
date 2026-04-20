import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const ALL_LINKS = [
  { href: '/configuracoes/empresa', label: 'Empresa', adminOnly: true },
  { href: '/configuracoes/departamentos', label: 'Departamentos', adminOnly: true },
  { href: '/configuracoes/cargos', label: 'Cargos', adminOnly: true },
  { href: '/configuracoes/competencias', label: 'Competências', adminOnly: true },
  { href: '/configuracoes/auditoria', label: 'Auditoria', adminOnly: true },
  { href: '/configuracoes/perfil', label: 'Meu perfil', adminOnly: false },
];

export default async function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin_rh';
  const links = ALL_LINKS.filter((l) => !l.adminOnly || isAdmin);

  return (
    <div className="flex gap-8">
      <nav className="w-44 shrink-0">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Configurações
        </p>
        <ul className="space-y-0.5">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
