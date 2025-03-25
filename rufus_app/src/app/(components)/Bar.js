"use client";

import React from "react";
import Image from "next/image";

export default function Bar() {
  return (
    <div className="flex flex-row items-center justify-center gap-4 overflow-x-auto pb-4 border-b">
      {[
        { src: "/yo.png", alt: "Yo" },
        { src: "/yo quiero.png", alt: "Yo quiero" },
        { src: "/comer.png", alt: "Comer" },
        { src: "/comer.png", alt: "Comer repetido" },
      ].map((img, i) => (
        <div key={i} className="flex-shrink-0">
          <Image
            src={img.src}
            alt={img.alt}
            width={200}
            height={200}
            className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain"
          />
        </div>
      ))}
    </div>
  );
}
