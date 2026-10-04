import React from 'react';
import { Search, X } from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onHomeClick?: () => void;
  onOpenUpload?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  setSearchQuery,
  onHomeClick,
  onOpenUpload
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim() === 'Prems@3738') {
        e.preventDefault();
        onOpenUpload?.();
        setSearchQuery('');
      }
    }
  };

  const handleSearchChange = (val: string) => {
    if (val.trim() === 'Prems@3738') {
      onOpenUpload?.();
      setSearchQuery('');
      return;
    }
    setSearchQuery(val);
  };

  return (
    <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Brand Logo - Just Logo + Chitram */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              onHomeClick?.();
            }} 
            className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
          >
            <img
              src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhvTYp98hmZVvmpEmuQjvE7GqgjwZQahJo8tA4IAMsTldvEEWzfZXOCo1z4pRuC9FPy6n1f8IPgyJb9AyK_kROkv9ePGI3Y1Z06p6r1NNMxdqVzGJJf5Td_A4wk86ArhZRXhIbRfn9t-KBNZJB3ScxiAJNx3cbf33uArCXfPJPrB-u_N8-IOBXcNdoD8iVj/s320/WhatsApp%20Image%202026-10-04%20at%209.40.28%20AM.jpeg"
              alt="Chitram Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover ring-1 ring-neutral-800"
            />
            <span className="text-lg sm:text-xl font-semibold tracking-tight text-white font-google-sans">
              Chitram
            </span>
          </button>

          {/* Search Bar on Right */}
          <div className="flex items-center">
            <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 sm:py-1.5 w-44 sm:w-64 focus-within:border-white transition-colors">
              <Search className="w-3.5 h-3.5 text-neutral-400 mr-1.5 shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-neutral-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
