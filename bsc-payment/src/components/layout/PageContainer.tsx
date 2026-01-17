import React from 'react';
import { cn } from '../../lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-7xl',
};

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  maxWidth = 'full'
}) => {
  return (
    <main className={cn(
      "flex-1 py-6 px-4 sm:px-6 lg:px-8",
      className
    )}>
      <div className={cn(
        "mx-auto",
        maxWidthClasses[maxWidth]
      )}>
        {children}
      </div>
    </main>
  );
};

export default PageContainer;
