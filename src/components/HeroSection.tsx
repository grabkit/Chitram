import React from 'react';

export const HeroSection: React.FC = () => {
  return (
    <section className="pt-5 pb-2 flex justify-center">
      <div className="w-full sm:w-1/2 mx-auto text-center px-4">
        <h1 className="text-2xl sm:text-4xl font-medium tracking-tight text-neutral-100 font-google-sans">
          Where every frame matters
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1.5 leading-relaxed font-normal">
          Stream and download your favorite movies in HD & 4K. Simple, fast, and high quality. developed for all devices
        </p>
      </div>
    </section>
  );
};
