import React from "react";

export default function Logo({ size = "text-2xl", className = "" }: { size?: string; className?: string }) {
  return (
    <div className={`inline-block ${className}`}>
      <h1
        className={`font-bold leading-none ${size} tracking-tight select-none`}
        aria-label="Meddata Secured"
      >
        <span className="text-blue-600">M</span>
        <span className="text-red-500">e</span>
        <span className="text-yellow-500">d</span>
        <span className="text-green-600">d</span>
        <span className="text-blue-600">a</span>
        <span className="text-red-500">t</span>
        <span className="text-yellow-500">a</span>
        <span className="invisible text-yellow-500">a</span> {/* Placeholder pour alignement */}
      </h1>
      <div className="relative">
        <span
          className="block text-sm uppercase tracking-[0.25em] text-black/90 font-bold logo-secured"
          style={{ position: "absolute", top: "100%", left: "50%" }}
        >
          Secured
        </span>
      </div>
    </div>
  );
}