import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-neutral-900 bg-black text-neutral-500 py-8 px-4 sm:px-6 lg:px-8 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <img
            src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhvTYp98hmZVvmpEmuQjvE7GqgjwZQahJo8tA4IAMsTldvEEWzfZXOCo1z4pRuC9FPy6n1f8IPgyJb9AyK_kROkv9ePGI3Y1Z06p6r1NNMxdqVzGJJf5Td_A4wk86ArhZRXhIbRfn9t-KBNZJB3ScxiAJNx3cbf33uArCXfPJPrB-u_N8-IOBXcNdoD8iVj/s320/WhatsApp%20Image%202026-10-04%20at%209.40.28%20AM.jpeg"
            alt="Chitram Logo"
            className="w-6 h-6 rounded object-cover ring-1 ring-neutral-800"
          />
          <span className="font-bold text-white tracking-normal font-google-sans">Chitram</span>
          <span className="text-neutral-500">• Movie Streaming & Downloads</span>
        </div>
        <p>© {new Date().getFullYear()} Chitram. All rights reserved.</p>
      </div>
    </footer>
  );
};
