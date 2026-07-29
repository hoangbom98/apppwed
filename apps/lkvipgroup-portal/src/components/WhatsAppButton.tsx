"use client";

import { useEffect, useState } from "react";

export default function WhatsAppButton() {
  const [phone, setPhone] = useState("971500000000");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.data?.whatsapp) setPhone(data.data.whatsapp);
      })
      .catch(() => {});
  }, []);

  const message = encodeURIComponent(
    "Hello, I would like to enquire about Fortress Investment Holdings."
  );

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 group"
      aria-label="Chat on WhatsApp"
    >
      <div className="relative">
        {/* Ping animation ring */}
        <div className="absolute inset-0 bg-green-500 animate-ping opacity-20 rounded-full" />
        {/* Button */}
        <div className="relative w-14 h-14 bg-[#25D366] hover:bg-[#1ebe5d] flex items-center justify-center shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-110 rounded-full">
          {/* Official WhatsApp SVG logo */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            className="w-8 h-8"
            fill="white"
            aria-hidden="true"
          >
            <path d="M16.003 2.667C8.638 2.667 2.667 8.638 2.667 16c0 2.357.638 4.663 1.848 6.674L2.667 29.333l6.825-1.792A13.27 13.27 0 0 0 16.003 29.333C23.362 29.333 29.333 23.362 29.333 16S23.362 2.667 16.003 2.667zm0 24.267a11.01 11.01 0 0 1-5.615-1.538l-.402-.24-4.05 1.063 1.082-3.944-.263-.414A10.994 10.994 0 0 1 5.003 16c0-6.065 4.934-11 11-11s11 4.935 11 11-4.934 11-11 11zm6.03-8.23c-.33-.165-1.953-.963-2.256-1.073-.303-.11-.524-.165-.745.165-.22.33-.854 1.073-1.047 1.294-.193.22-.385.248-.715.083-.33-.165-1.393-.514-2.653-1.637-.981-.874-1.643-1.953-1.836-2.283-.193-.33-.02-.508.145-.673.15-.148.33-.385.495-.578.165-.193.22-.33.33-.55.11-.22.055-.413-.027-.578-.083-.165-.745-1.794-1.02-2.457-.269-.645-.543-.557-.745-.568l-.634-.011c-.22 0-.578.083-.88.413-.303.33-1.155 1.128-1.155 2.753s1.183 3.194 1.348 3.414c.165.22 2.328 3.555 5.642 4.987.788.34 1.403.543 1.882.695.791.252 1.511.216 2.08.131.635-.094 1.953-.798 2.229-1.568.275-.77.275-1.43.193-1.568-.083-.138-.303-.22-.633-.385z" />
          </svg>
        </div>
      </div>
    </a>
  );
}
