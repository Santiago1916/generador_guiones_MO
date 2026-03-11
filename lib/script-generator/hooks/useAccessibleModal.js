"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true"
  );
}

export function useAccessibleModal({ isOpen, onClose, onPrevious, onNext, enableVideoNavigation = false }) {
  const modalRef = useRef(null);
  const restoreFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    restoreFocusRef.current = document.activeElement;
    const modalNode = modalRef.current;
    const focusableElements = getFocusableElements(modalNode);
    const firstFocusable = focusableElements[0];

    if (firstFocusable) {
      window.setTimeout(() => firstFocusable.focus(), 0);
    } else {
      modalNode?.focus();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("modal-open");
    document.documentElement.classList.add("modal-open");

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key === "Tab") {
        const focusable = getFocusableElements(modalNode);
        if (!focusable.length) {
          event.preventDefault();
          return;
        }

        const currentIndex = focusable.indexOf(document.activeElement);
        const nextIndex = event.shiftKey
          ? currentIndex <= 0
            ? focusable.length - 1
            : currentIndex - 1
          : currentIndex === focusable.length - 1
            ? 0
            : currentIndex + 1;

        event.preventDefault();
        focusable[nextIndex]?.focus();
        return;
      }

      if (!enableVideoNavigation || event.altKey !== true) return;
      if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onPrevious?.();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        onNext?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
      const elementToRestore = restoreFocusRef.current;
      if (elementToRestore instanceof HTMLElement) {
        window.setTimeout(() => elementToRestore.focus(), 0);
      }
    };
  }, [enableVideoNavigation, isOpen, onClose, onNext, onPrevious]);

  return modalRef;
}
