// src/components/medications/VoiceScheduleButton.jsx
"use client";
import { useState, useRef } from "react";

/**
 * Botó de gravació de veu per dictar una programació.
 * Quan acaba, crida onResult(data) amb la resposta del backend.
 */
export default function VoiceScheduleButton({ onResult, dark }) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await sendAudio(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error(err);
      setError("No s'ha pogut accedir al micròfon. Comprova els permisos.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setProcessing(true);
    }
  };

  const sendAudio = async (blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", blob, "voice.webm");

      const res = await fetch("/api/voice-schedule", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error processant l'àudio");
        setProcessing(false);
        return;
      }

      onResult(data);
    } catch (err) {
      console.error(err);
      setError("Error de connexió");
    } finally {
      setProcessing(false);
    }
  };

  const handleClick = () => {
    if (processing) return;
    recording ? stopRecording() : startRecording();
  };

  // Estats visuals
  let label, icon, color;
  if (processing) {
    label = "Processant...";
    icon = "⏳";
    color = "from-amber-500 to-amber-600";
  } else if (recording) {
    label = "Aturar gravació";
    icon = "⏹️";
    color = "from-red-500 to-red-600 animate-pulse";
  } else {
    label = "Dictar amb veu";
    icon = "🎤";
    color = "from-violet-500 to-purple-600";
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={processing}
        className={`w-full py-3 rounded-xl bg-linear-to-r ${color} text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all`}
      >
        <span className="text-lg">{icon}</span>
        {label}
      </button>

      {recording && (
        <p className={`text-xs mt-2 text-center ${dark ? "text-slate-400" : "text-slate-500"}`}>
          Diu, per exemple: "Paracetamol cada dia a les 8 del matí, 1 pastilla"
        </p>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
