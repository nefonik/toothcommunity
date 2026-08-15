import React from "react";

interface ToothIconProps {
  className?: string;
  size?: number;
  color?: string;
  fill?: string;
}

/**
 * Authentic Discord-like Tooth Logo Icon (The signature ToothChat emblem)
 */
export const ToothLogoIcon: React.FC<ToothIconProps> = ({
  className = "w-7 h-7",
  size,
  color = "currentColor",
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    width={size}
    height={size}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Stylized Tooth with Discord-esque curves and friendly gaming vibe */}
    <path d="M12 2C8.5 2 6 4 5 7C4 10 4.5 13.5 5.5 16.5C6.5 19.5 8 22 9.5 22C10.8 22 11 19.5 11.5 17.5C11.8 16.3 12.2 16.3 12.5 17.5C13 19.5 13.2 22 14.5 22C16 22 17.5 19.5 18.5 16.5C19.5 13.5 20 10 19 7C18 4 15.5 2 12 2ZM9 7.5C9.8 7.5 10.5 8.2 10.5 9C10.5 9.8 9.8 10.5 9 10.5C8.2 10.5 7.5 9.8 7.5 9C7.5 8.2 8.2 7.5 9 7.5ZM15 7.5C15.8 7.5 16.5 8.2 16.5 9C16.5 9.8 15.8 10.5 15 10.5C14.2 10.5 13.5 9.8 13.5 9C13.5 8.2 14.2 7.5 15 7.5ZM12 14.5C10.5 14.5 9.2 13.8 8.8 13C8.6 12.6 8.9 12.2 9.4 12.2C9.7 12.2 10 12.4 10.2 12.6C10.6 13 11.3 13.3 12 13.3C12.7 13.3 13.4 13 13.8 12.6C14 12.4 14.3 12.2 14.6 12.2C15.1 12.2 15.4 12.6 15.2 13C14.8 13.8 13.5 14.5 12 14.5Z" />
  </svg>
);

/**
 * Single Molar Tooth Icon (Crisp Outline / Fill)
 */
export const ToothOutlineIcon: React.FC<ToothIconProps> = ({
  className = "w-5 h-5",
  size,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M7 2C4.5 2 3 4 3 6.5C3 9 3.5 12 4.5 15C5.5 18 7 21 8.5 21C10 21 10.5 18 11.5 16C11.8 15.3 12.2 15.3 12.5 16C13.5 18 14 21 15.5 21C17 21 18.5 18 19.5 15C20.5 12 21 9 21 6.5C21 4 19.5 2 17 2C14.5 2 13.5 3.5 12 3.5C10.5 3.5 9.5 2 7 2Z" />
  </svg>
);

/**
 * Tooth Hash (# channel symbol styled as a tooth channel)
 */
export const ToothHashIcon: React.FC<ToothIconProps> = ({
  className = "w-5 h-5",
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M5.8 4C4.5 4 3.5 5.2 3.5 6.8C3.5 8.5 3.8 10.5 4.5 12.5C5.2 14.5 6.2 16.5 7.2 16.5C8.2 16.5 8.5 14.5 9.2 13.2C9.4 12.7 9.8 12.7 10 13.2C10.7 14.5 11 16.5 12 16.5C13 16.5 14 14.5 14.7 12.5C15.4 10.5 15.7 8.5 15.7 6.8C15.7 5.2 14.7 4 13.4 4C11.7 4 11 5 10 5C9 5 8.3 4 5.8 4Z" opacity="0.4" />
    <path d="M10 2L8.5 22M15.5 2L14 22M4 9H20M3 15H19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

/**
 * Tooth Voice Speaker Icon
 */
export const ToothSpeakerIcon: React.FC<ToothIconProps> = ({
  className = "w-5 h-5",
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M11 5L6 9H3C2.45 9 2 9.45 2 10V14C2 14.55 2.45 15 3 15H6L11 19V5Z" fill="currentColor" fillOpacity="0.2" />
    <path d="M15.5 8.5C16.8 9.8 17.5 11.2 17.5 12C17.5 12.8 16.8 14.2 15.5 15.5" />
    <path d="M19 5C21 7.5 22 9.8 22 12C22 14.2 21 16.5 19 19" />
  </svg>
);

/**
 * Tooth Shield E2EE Icon
 */
export const ToothShieldIcon: React.FC<ToothIconProps> = ({
  className = "w-5 h-5",
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2L4 5V11.5C4 16.5 7.5 21 12 22C16.5 21 20 16.5 20 11.5V5L12 2Z"
      fill="currentColor"
      fillOpacity="0.15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Inner Tooth in Shield */}
    <path
      d="M12 7C10.2 7 9 8 8.5 9.5C8 11 8.3 12.8 8.8 14.2C9.3 15.6 10.1 17 10.8 17C11.5 17 11.6 15.8 11.8 14.8C11.9 14.2 12.1 14.2 12.2 14.8C12.4 15.8 12.5 17 13.2 17C13.9 17 14.7 15.6 15.2 14.2C15.7 12.8 16 11 15.5 9.5C15 8 13.8 7 12 7Z"
      fill="currentColor"
    />
  </svg>
);

/**
 * Tooth Nitro / Gemini AI Sparkle Icon
 */
export const ToothSparkleIcon: React.FC<ToothIconProps> = ({
  className = "w-5 h-5",
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2C9 2 7 3.5 6 6C5 8.5 5.5 11.5 6.5 14C7.5 16.5 8.8 18.5 10 18.5C11 18.5 11.2 16.5 11.6 15C11.8 14 12.2 14 12.4 15C12.8 16.5 13 18.5 14 18.5C15.2 18.5 16.5 16.5 17.5 14C18.5 11.5 19 8.5 18 6C17 3.5 15 2 12 2Z" fillOpacity="0.85" />
    <path d="M19 15L17.5 19L19 23L20.5 19L19 15Z" fill="#FEE75C" />
    <path d="M5 2L4 4.5L5 7L6 4.5L5 2Z" fill="#FEE75C" />
  </svg>
);

/**
 * Tooth Crown (Owner / Server Master)
 */
export const ToothCrownIcon: React.FC<ToothIconProps> = ({
  className = "w-4 h-4 text-amber-400",
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM5 19C5 19.55 5.45 20 6 20H18C18.55 20 19 19.55 19 19V18H5V19Z" />
  </svg>
);

/**
 * Discord Plus Button (+) with Tooth Accents
 */
export const ToothPlusIcon: React.FC<ToothIconProps> = ({
  className = "w-5 h-5",
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

/**
 * Tooth Settings Gear
 */
export const ToothGearIcon: React.FC<ToothIconProps> = ({
  className = "w-4 h-4",
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
