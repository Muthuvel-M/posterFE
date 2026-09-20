import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { InstagramIcon } from './InstagramIcon';
import { useModalAnimation } from '../hooks/useModalAnimation';
import instaQrImg from '../assets/IMG_4155.jpg';

export const InstagramQRModal = ({ isOpen, onClose, settings, user }) => {
  const { shouldRender, isClosing, requestClose } = useModalAnimation(isOpen, onClose);

  if (!shouldRender) return null;

  const instagramUrl = settings?.instagramUrl || 'https://www.instagram.com/aura.frame26/';
  const userName = user?.name || settings?.businessName || 'Aura Frame';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md no-print ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'
      }`}
      onClick={requestClose}
    >
      {/* Modal Card */}
      <div
        className={`relative w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] bg-[#141417] border border-zinc-800/90 p-6 sm:p-7 shadow-2xl text-center flex flex-col items-center ${
          isClosing ? 'animate-modal-slide-down' : 'animate-modal-slide-up'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Right Close Button */}
        <button
          onClick={requestClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Close"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Instagram Gradient Squircle Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-lg shadow-pink-500/20 mb-2.5">
          <InstagramIcon className="w-7 h-7" />
        </div>

        {/* Subtitle & Title */}
        <span className="text-[10.5px] font-extrabold uppercase tracking-widest text-zinc-400 block">
          INSTAGRAM PROFILE
        </span>
        <h3 className="text-xl font-black tracking-tight text-white mt-0.5 mb-4">
          @aura.frame26
        </h3>

        {/* QR Code Container with Official Instagram Image */}
        <div className="p-3 bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center mb-4 overflow-hidden max-w-[240px] w-full aspect-square">
          <img
            src={instaQrImg}
            alt="Instagram QR @aura.frame26"
            className="w-full h-full object-contain rounded-2xl"
          />
        </div>

        {/* Direct Link Action Button */}
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 active:scale-95 transition-all mb-2 cursor-pointer"
        >
          <span>Open Instagram Page</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* Caption */}
        <p className="text-[11px] text-zinc-400 font-medium leading-relaxed max-w-[240px]">
          Scan with your phone camera or Instagram app to visit @aura.frame26!
        </p>
      </div>
    </div>
  );
};
