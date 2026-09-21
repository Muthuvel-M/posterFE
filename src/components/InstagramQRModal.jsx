import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, Share2 } from 'lucide-react';
import { InstagramIcon } from './InstagramIcon';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { useToast } from '../context/ToastContext';
import instaQrImg from '../assets/IMG_4155.jpg';

export const InstagramQRModal = ({ isOpen, onClose, settings, user }) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const { shouldRender, isClosing, requestClose } = useModalAnimation(isOpen, onClose);

  if (!shouldRender) return null;

  const instagramUrl = settings?.instagramUrl || 'https://www.instagram.com/aura.frame26/';
  const handle = '@aura.frame26';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(instagramUrl);
      setCopied(true);
      showToast('Instagram profile link copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('Failed to copy link', 'error');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AuraFrame26 Instagram Profile',
          text: 'Check out AuraFrame26 for premium posters & custom framing!',
          url: instagramUrl,
        });
      } catch (e) {
        if (e.name !== 'AbortError') handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl no-print overflow-hidden ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'
      }`}
      onClick={requestClose}
    >
      {/* Liquid Ambient Background Lights */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-gradient-to-tr from-pink-500/30 via-rose-500/25 to-purple-600/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-gradient-to-br from-amber-500/25 via-orange-500/20 to-pink-600/30 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Liquid Glass Modal Card (Centered on all screen sizes) */}
      <div
        className={`relative w-full max-w-sm rounded-[36px] bg-white/[0.08] backdrop-blur-3xl border border-white/25 shadow-[0_25px_70px_rgba(0,0,0,0.75),inset_0_1px_1px_rgba(255,255,255,0.4),0_0_40px_rgba(236,72,153,0.18)] p-6 sm:p-7 text-center flex flex-col items-center overflow-hidden my-auto ${
          isClosing ? 'animate-modal-slide-down' : 'animate-modal-slide-up'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow:
            '0 30px 80px rgba(0, 0, 0, 0.8), inset 0 1.5px 1.5px rgba(255, 255, 255, 0.45), 0 0 45px rgba(236, 72, 153, 0.22)',
        }}
      >
        {/* Specular Glass Sheen Top Edge */}
        <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />

        {/* Top Right Liquid Glass Close Button */}
        <button
          onClick={requestClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
          title="Close"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Instagram Gradient Squircle Icon with Glass Ring */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-[0_10px_30px_rgba(220,39,67,0.45)] ring-4 ring-white/20 mb-3 transition-transform hover:scale-105">
          <InstagramIcon className="w-8 h-8" />
        </div>

        {/* Subtitle & Title */}
        <span className="text-[10.5px] font-black uppercase tracking-widest text-pink-300 drop-shadow-sm block">
          INSTAGRAM QR
        </span>
        <h3 className="text-2xl font-black tracking-tight text-white drop-shadow-md mt-0.5 mb-4">
          {handle}
        </h3>

        {/* QR Code Container with High-Res Image & Glass Border */}
        <div className="relative p-3.5 bg-white/95 rounded-[28px] shadow-[0_15px_35px_rgba(0,0,0,0.45)] flex flex-col items-center justify-center mb-4 overflow-hidden max-w-[240px] w-full aspect-square ring-4 ring-white/25">
          <img
            src={instaQrImg}
            alt="Instagram QR @aura.frame26"
            className="w-full h-full object-contain rounded-2xl"
          />
        </div>

        {/* Liquid Action Buttons Grid */}
        <div className="w-full space-y-2">
          {/* Direct Link Action Button */}
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(220,39,67,0.35)] active:scale-95 transition-all cursor-pointer border border-white/20"
          >
            <span>Open Profile on Instagram</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Copy Link & Share in Liquid Glass Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white/90 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="py-2.5 px-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white/90 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share QR</span>
            </button>
          </div>
        </div>

        {/* Caption */}
        <p className="text-[11px] text-zinc-300/80 font-medium leading-relaxed max-w-[240px] mt-3">
          Scan with phone camera or Instagram app to visit <strong className="text-white">@aura.frame26</strong>
        </p>
      </div>
    </div>
  );
};
