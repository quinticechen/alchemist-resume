import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from "./LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";

const navigation = [
  { name: 'Workshop', href: '/alchemist-workshop' },
  { name: 'Records', href: '/alchemy-records' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Job Websites', href: '/job-websites' },
];

const Header = () => {
  const { session, signOut } = useAuth();
  const { t } = useTranslation();
  const { checkSubscriptionAndRedirect } = useSubscriptionCheck();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-background border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="font-bold text-2xl">
          Resume Alchemist
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          {navigation.map((item) => (
            <Link key={item.name} to={item.href} className="text-sm font-medium transition-colors hover:text-primary">
              {t(`common.${item.name.toLowerCase().replace(' ', '')}`)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user?.user_metadata?.avatar_url as string} alt={session?.user?.user_metadata?.full_name as string} />
                    <AvatarFallback>{session?.user?.user_metadata?.full_name?.charAt(0) as string}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>
                  {session?.user?.user_metadata?.full_name as string}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account">Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  {t('common.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button variant="ghost">{t('common.signIn')}</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
