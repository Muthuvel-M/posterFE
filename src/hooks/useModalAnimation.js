import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to handle down-to-up slide open and close animations for modals
 * @param {boolean} isOpen
 * @param {Function} onClose
 * @param {number} duration animation duration in ms (default 300)
 */
export const useModalAnimation = (isOpen, onClose, duration = 350) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const closingTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (closingTimeoutRef.current) {
        clearTimeout(closingTimeoutRef.current);
      }
      setShouldRender(true);
      setIsClosing(false);
      // Small frame delay to trigger CSS transition smoothly
      const frame = requestAnimationFrame(() => {
        setIsMounted(true);
      });
      return () => cancelAnimationFrame(frame);
    } else if (shouldRender) {
      setIsMounted(false);
      setIsClosing(true);
      closingTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, duration);
      return () => {
        if (closingTimeoutRef.current) clearTimeout(closingTimeoutRef.current);
      };
    }
  }, [isOpen, duration]);



  const requestClose = () => {
    if (isClosing) return;
    setIsMounted(false);
    setIsClosing(true);
    closingTimeoutRef.current = setTimeout(() => {
      setShouldRender(false);
      setIsClosing(false);
      if (onClose) onClose();
    }, duration);
  };

  return {
    shouldRender,
    isClosing,
    isMounted,
    requestClose,
  };
};
