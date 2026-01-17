import React from 'react';
import { Link } from 'react-router-dom';
import { useParent } from '../../context/ParentContext';
import { Avatar, AvatarFallback } from '../ui/avatar';

const Header: React.FC = () => {
  const { parent } = useParent();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <img
            src={`${process.env.PUBLIC_URL}/BSClogo.jpg`}
            alt="BSC Logo"
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-primary">British Spring College</h1>
            <p className="text-xs text-muted-foreground">Payment Portal</p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {parent && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium">
                  {parent.first_name} {parent.last_name}
                </p>
                <p className="text-xs text-muted-foreground">{parent.email}</p>
              </div>
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials(parent.first_name, parent.last_name)}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
