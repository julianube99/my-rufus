'use client';

import Image from 'next/image';

export default function Home() {
  return (
    <main className="container mx-auto py-6 px-2 sm:py-10 sm:px-4">
      <div className="flex flex-row items-center justify-center gap-2 sm:gap-4 overflow-x-auto">
        <div className="flex-shrink-0">
          <Image 
            src="/yo.png" 
            alt="Yo" 
            width={200} 
            height={200}
            className="w-16 h-16 xs:w-24 xs:h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 object-contain"
          />
        </div>
        <div className="flex-shrink-0">
          <Image 
            src="/yo quiero.png" 
            alt="Yo quiero" 
            width={200} 
            height={200}
            className="w-16 h-16 xs:w-24 xs:h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 object-contain"
          />
        </div>
        <div className="flex-shrink-0">
          <Image 
            src="/comer.png" 
            alt="Comer" 
            width={200} 
            height={200}
            className="w-16 h-16 xs:w-24 xs:h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 object-contain"
          />
        </div>
        <div className="flex-shrink-0">
          <Image 
            src="/comer.png" 
            alt="Comer" 
            width={200} 
            height={200}
            className="w-16 h-16 xs:w-24 xs:h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 object-contain"
          />
        </div>
      </div>
    </main>
  );
}