"use client";

import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

type Props = {
  onSave: (dataUrl: string) => void;
  onClear?: () => void;
};

export function SignatureDraw({ onSave, onClear }: Props) {
  const sigRef = useRef<SignatureCanvas>(null);

  const handleSave = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      onSave(sigRef.current.toDataURL("image/png"));
    }
  };

  const handleClear = () => {
    sigRef.current?.clear();
    onClear?.();
  };

  return (
    <div className="space-y-2">
      <div className="rounded-lg border-2 border-dashed border-stone-300 bg-white p-2">
        <SignatureCanvas
          ref={sigRef}
          canvasProps={{
            className: "w-full h-32 touch-none",
          }}
          backgroundColor="white"
          penColor="black"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Use this signature
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
