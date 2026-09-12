'use client';
import { useEffect, useRef, useState, startTransition, ViewTransition } from 'react';
import Image from 'next/image';
import Reveal from '@/components/motion/Reveal';
import { GalleryImage } from '@/types';
import styles from './GalleryGrid.module.css';

interface GalleryGridProps {
  images: GalleryImage[];
}

export default function GalleryGrid({ images }: GalleryGridProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = images.find((image) => image.id === openId) ?? null;
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const openImage = (id: string, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    startTransition(() => setOpenId(id));
  };

  const closeImage = () => {
    startTransition(() => setOpenId(null));
  };

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeImage();
        return;
      }

      // The dialog has exactly one focusable descendant — the Close button
      // — so containing focus doesn't require walking a ring of elements:
      // Tab and Shift+Tab should both just leave focus where it already is.
      // Refocusing explicitly (rather than a bare preventDefault) states
      // that intent directly and is self-correcting if focus is ever
      // programmatically moved elsewhere while the dialog is open.
      if (event.key === 'Tab') {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Move focus into the dialog when it opens, and back to the tile that
  // triggered it when it closes.
  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    } else if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [open]);

  // A plain `<div role="dialog">` gets no browser-enforced modality, unlike
  // native <dialog>.showModal(). Lock background scroll ourselves while the
  // dialog is open, restoring whatever value was there before rather than
  // assuming it was empty. The lock sits on <html>, not <body>: Lenis
  // ignores body overflow, but its autoToggle option (see
  // SmoothScrollProvider) pauses smooth scrolling while the root element's
  // overflow is hidden.
  useEffect(() => {
    if (!open) return undefined;

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    return () => {
      root.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <Reveal
        as="div"
        className={styles.grid}
        stagger={0.05}
        aria-hidden={open ? true : undefined}
      >
        {images.map((image) => (
          <button
            key={image.id}
            type="button"
            className={styles.tile}
            aria-label={`View ${image.alt}`}
            onClick={(event) => openImage(image.id, event.currentTarget)}
          >
            <ViewTransition name={`gallery-${image.id}`} share="morph" default="none">
              {image.id === openId ? null : (
                <Image
                  className={styles.tileImage}
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 700px) 100vw, 33vw"
                />
              )}
            </ViewTransition>
          </button>
        ))}
      </Reveal>

      {open && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label={open.alt}
          onClick={closeImage}
        >
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.close}
            aria-label="Close image"
            onClick={(event) => {
              // The Close button sits inside the overlay, whose own
              // onClick is also closeImage — without this the click would
              // call closeImage twice (harmless, but not honest about
              // intent).
              event.stopPropagation();
              closeImage();
            }}
          >
            Close
          </button>

          <div onClick={(event) => event.stopPropagation()}>
            <ViewTransition name={`gallery-${open.id}`} share="morph" default="none">
              <figure className={styles.figure}>
                <Image
                  className={styles.full}
                  src={open.src}
                  alt={open.alt}
                  fill
                  sizes="100vw"
                />
              </figure>
            </ViewTransition>
            <figcaption className={styles.caption}>{open.alt}</figcaption>
          </div>
        </div>
      )}
    </>
  );
}
