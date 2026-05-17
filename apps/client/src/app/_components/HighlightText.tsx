"use client";
 
import React from "react";
 
/**
 * Simplified component that just renders children.
 * Highlights were removed as per user request.
 */
export function RoughHighlight({ children, delay, color, ...props }: { children: React.ReactNode; delay?: number; color?: string; [key: string]: any }) {
  return <span {...props}>{children}</span>;
}
 
export function HighlightText({ children, delay, color, ...props }: { children: React.ReactNode; delay?: number; color?: string; [key: string]: any }) {
  return <span {...props}>{children}</span>;
}
 
export function UnderlineText({ children, delay, color, ...props }: { children: React.ReactNode; delay?: number; color?: string; [key: string]: any }) {
  return <span {...props}>{children}</span>;
}
