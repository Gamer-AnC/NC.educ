import React, { useState, useRef, useEffect } from 'react';
import { Camera, FileImage, X, Video } from 'lucide-react';

interface PhotoUploaderProps {
  currentPhotoUrl?: string;
  onPhotoCaptured: (base64: string) => void;
  onClear?: () => void;
}

export default function PhotoUploader({ currentPhotoUrl, onPhotoCaptured, onClear }: PhotoUploaderProps) {
  const [mode, setMode] = useState<'IDLE' | 'CAMERA'>('IDLE');
  const [cameraError, setCameraError] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    setCameraError('');
    setMode('CAMERA');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 300, height: 300, facingMode: 'user' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError('Could not register camera access. Please use device files upload.');
      setMode('IDLE');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setMode('IDLE');
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 300;
      canvas.height = video.videoHeight || 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1); // Mirror correction for user facing camera snapshot
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onPhotoCaptured(dataUrl);
      }
      stopCamera();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        alert("To guarantee database sync speed, please upload a smaller profile picture under 800KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onPhotoCaptured(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div id="photo-uploader-widget" className="w-full flex flex-col items-center gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-150">
      <div className="relative w-36 h-36 rounded-full border-2 border-indigo-500/20 bg-slate-100 overflow-hidden shadow-inner flex items-center justify-center">
        {mode === 'CAMERA' ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover scale-x-[-1]" 
          />
        ) : currentPhotoUrl ? (
          <img 
            src={currentPhotoUrl} 
            alt="Profile Preview" 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="text-slate-400 flex flex-col items-center gap-1 p-4 text-center select-none">
            <Camera className="w-7 h-7 stroke-2 mb-1" />
            <span className="text-[10px] font-black uppercase tracking-wider leading-none">NO PICTURE</span>
            <span className="text-[9px] text-slate-450 leading-tight block mt-1 font-semibold">Ready to upload</span>
          </div>
        )}

        {currentPhotoUrl && mode === 'IDLE' && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md transition-all cursor-pointer"
            title="Remove Photo"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {cameraError && (
        <p className="text-rose-700 text-[10px] font-bold text-center bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
          {cameraError}
        </p>
      )}

      <div className="flex gap-2.5 w-full">
        {mode === 'CAMERA' ? (
          <>
            <button
              type="button"
              onClick={capturePhoto}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg tracking-wider uppercase flex items-center justify-center gap-1 cursor-pointer shadow-sm"
            >
              <Camera className="w-3.5 h-3.5" /> Capture Frame
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-[10px] rounded-lg tracking-wider uppercase cursor-pointer"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={startCamera}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg tracking-wider uppercase flex items-center justify-center gap-1 cursor-pointer shadow-sm"
            >
              <Video className="w-3.5 h-3.5" /> Use Camera
            </button>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-extrabold text-[10px] rounded-lg tracking-wider uppercase flex items-center justify-center gap-1 cursor-pointer shadow-sm"
            >
              <FileImage className="w-3.5 h-3.5 text-slate-500" /> Device Files
            </button>
          </>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>
    </div>
  );
}
