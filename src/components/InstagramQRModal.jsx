import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';
import { InstagramIcon } from './InstagramIcon';
import { useModalAnimation } from '../hooks/useModalAnimation';

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
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-lg shadow-pink-500/20 mb-3">
          <InstagramIcon className="w-8 h-8" />
        </div>

        {/* Subtitle & Title */}
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400 block">
          INSTAGRAM PROFILE
        </span>
        <h3 className="text-xl font-black tracking-tight text-white mt-0.5 mb-5">
          {userName}
        </h3>

        {/* QR Code Container */}
        <div className="p-4 bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center mb-4">
          <QRCodeSVG
            value={instagramUrl}
            size={180}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Domain / Handle Pill Badge */}
        <div className="px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-pink-400 font-bold mb-3 flex items-center gap-1.5 shadow-sm">
          <InstagramIcon className="w-3.5 h-3.5 text-pink-500" />
          <span>{instagramUrl.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, '@').replace(/\/$/, '') || '@aura.frame26'}</span>
        </div>

        {/* Caption */}
        <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-[240px]">
          Scan this QR to visit our Instagram page and check out our latest posts!
        </p>
      </div>
    </div>
  );
};
