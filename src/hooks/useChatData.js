// hooks/useChatData.js
// Hook personalitzat que gestiona totes les dades del xat entre cuidador i pacient.
// Carrega missatges de les dues taules (manual_commands i voice_messages),
// els combina en un format unificat i s'actualitza en temps real via Supabase Realtime.
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export function useChatData() {
  const [robot, setRobot] = useState(null);
  const [patient, setPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Obté el robot vinculat a l'usuari autenticat
    const { data: robotData } = await supabase
      .from("robots")
      .select("*")
      .eq("owner_id", user.id)
      .single();
    
    setRobot(robotData);
    
    if (!robotData) { 
      setLoading(false); 
      return; 
    }

    // Obté el pacient vinculat al robot
    const { data: patientData } = await supabase
      .from("patients")
      .select("*")
      .eq("robot_id", robotData.id)
      .single();
      
    setPatient(patientData);

    // Missatges enviats pel cuidador al pacient (via /api/speak-message)
    const { data: caregiverMsgs } = await supabase
      .from("manual_commands")
      .select("id, robot_id, message_text, status, created_at")
      .eq("robot_id", robotData.id)
      .eq("type", "speak")
      .order("created_at", { ascending: true })
      .limit(100);

    // Missatges de veu del pacient processats per Gemini (via /api/robot-voice)
    const { data: patientMsgs } = await supabase
      .from("voice_messages")
      .select("id, robot_id, transcript, urgency, intent, read_by_caregiver, created_at")
      .eq("robot_id", robotData.id)
      .order("created_at", { ascending: true })
      .limit(100);

    // Combina i normalitza els dos tipus de missatge al format que espera ConversationView
    // Ambdós tipus comparteixen: id, robot_id, sender, content, urgency, created_at
    const combined = [
      ...(caregiverMsgs || []).map(m => ({
        id: m.id,
        robot_id: m.robot_id,
        sender: "caregiver",
        content: m.message_text,
        urgency: "normal",
        intent: null,
        is_read: true,
        command_status: m.status,  // pending/in_progress/completed/failed
        created_at: m.created_at,
      })),
      ...(patientMsgs || []).map(m => ({
        id: m.id,
        robot_id: m.robot_id,
        sender: "patient",
        content: m.transcript,
        urgency: m.urgency,        // low/normal/high/emergency
        intent: m.intent,          // caregiver/robot/unclear
        is_read: m.read_by_caregiver,
        command_status: null,
        created_at: m.created_at,
      })),
    ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    setMessages(combined);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();

    // Subscripció a Supabase Realtime per actualitzar el xat sense polling
    // S'activa quan arriba un missatge nou del pacient o quan el robot
    // actualitza l'estat d'un missatge del cuidador (completed/failed)
    const channel = supabase
      .channel('chat_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'voice_messages' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'manual_commands' },
        () => fetchData()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchData]);

  // Marca automàticament com a llegits els missatges del pacient quan el cuidador obre el xat
  useEffect(() => {
    if (!robot || messages.length === 0) return;
    
    const unread = messages
      .filter(m => m.sender === "patient" && !m.is_read)
      .map(m => m.id);
    
    if (unread.length > 0) {
      supabase
        .from("voice_messages")
        .update({ read_by_caregiver: true })
        .in("id", unread)
        .then(() => {});
    }
  }, [robot, messages]);

  const handleSendMessage = async (text) => {
    // Envia el missatge al cloud que genera TTS i crea la comanda per al robot
    console.log("Enviant:", { robot_id: robot?.id, message: text });

    const res = await fetch("/api/speak-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        robot_id: robot.id,
        message: text,
      }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Error enviant missatge");
    }
    await fetchData();
    return data;
  };

  return {
    robot,
    patient,
    messages,
    loading,
    handleSendMessage
  };
}