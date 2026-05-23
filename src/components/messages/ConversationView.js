// src/components/messages/ConversationView.jsx
"use client";

import { useRef, useEffect } from "react";

import MessageBubble from "./MessageBubble";

export default function ConversationView({ messages, patientName, dark }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("ca-ES", { 
      day: "numeric", 
      month: "short", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  // Agrupar per dia
  const groupedByDay = messages.reduce((acc, msg) => {
    const day = new Date(msg.created_at).toLocaleDateString("ca-ES", {
      weekday: "long", day: "numeric", month: "long"
    });
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  if (messages.length === 0) {
    return (
      <div 
        ref={scrollRef}
        className={`flex-1 flex items-center justify-center text-center p-6 ${
          dark ? "text-slate-500" : "text-slate-400"
        }`}
      >
        <div>
          <div className="text-4xl mb-2">💬</div>
          <p>Encara no hi ha missatges</p>
          <p className="text-xs mt-1">
            Comença una conversa escrivint un missatge a sota
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {Object.entries(groupedByDay).map(([day, dayMessages]) => (
        <div key={day}>
          <div className="flex items-center gap-2 my-3">
            <div className={`flex-1 h-px ${dark ? "bg-slate-800" : "bg-slate-100"}`} />
            <span className={`text-xs capitalize ${dark ? "text-slate-500" : "text-slate-400"}`}>
              {day}
            </span>
            <div className={`flex-1 h-px ${dark ? "bg-slate-800" : "bg-slate-100"}`} />
          </div>
          <div className="space-y-2">
            {dayMessages.map(msg => (
              <MessageBubble 
                key={`${msg.sender}-${msg.id}`} 
                msg={msg} 
                patientName={patientName}
                dark={dark} 
                formatTime={formatTime}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}