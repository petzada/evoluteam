'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, UserCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/features/auth/actions';
import { useSidebar } from '../SidebarContext';
import { cn } from '@/lib/utils';

interface UserCardProps {
  fullName: string;
  companyName: string;
  avatarUrl?: string | null;
}

export function UserCard({ fullName, companyName, avatarUrl }: UserCardProps) {
  const router = useRouter();
  const { collapsed } = useSidebar();
  const initials = fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className={cn('border-t border-sidebar-border py-3', collapsed ? 'px-2' : 'px-3')}>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'flex items-center rounded-md text-left hover:bg-sidebar-accent transition-colors',
            collapsed ? 'h-9 w-9 mx-auto justify-center' : 'w-full gap-3 px-2 py-2',
          )}
        >
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-medium truncate text-sidebar-foreground">{fullName}</span>
              <span className="text-[11px] text-sidebar-foreground/50 truncate">{companyName}</span>
            </div>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-48">
          <DropdownMenuItem onSelect={() => router.push('/configuracoes/perfil')}>
            <UserCircle className="mr-2 h-4 w-4" />
            Meu perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
