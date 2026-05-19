// src/app/dashboard/page.js
"use client";

import { useContext, useState, useEffect } from "react";
import { ThemeContext, SidebarContext } from "@/app/dashboard/layout";
import { supabase } from "@/lib/supabase"

import ScheduleForm from "@/components/medications/ScheduleForm";
import NoRobotDialog from "@/components/dashboard/NoRobotDialog";
import StatsRow from "@/components/dashboard/StatsRow";
import StatusCard from "@/components/dashboard/StatusCard";
import DispenseCard from "@/components/dashboard/DispenseCard";
import MedicationTable from "@/components/dashboard/MedicationTable";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import NextMedPanel from "@/components/dashboard/NextMedPanel";

// Nuevos componentes extraídos:
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import OfflineDialog from "@/components/dashboard/OfflineDialog";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";

export default function DashboardPage() {
  const { theme } = useContext(ThemeContext);
  const dark = theme === "dark";
  const { setOpen } = useContext(SidebarContext);
  
  // Estats
  const [robot,   setRobot]   = useState(null);
  const [patient, setPatient] = useState(null);
  const [meds,    setMeds]    = useState([]);
  const [logs,    setLogs]    = useState([]);
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [loadedSlots, setLoadedSlots] = useState([]);
  const [userId, setUserId] = useState(null);

  const isReallyOnline = robot?.status === "online" &&
    robot?.updated_at &&
    (new Date() - new Date(robot.updated_at)) < 60000;

  const handleRetry = async () => {
    setRetrying(true);
    await fetchData();
    setRetrying(false);
  };

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: robotData } = await supabase.from("robots").select("*").eq("owner_id", user.id).single();
    setRobot(robotData);
    if (!robotData) { setLoading(false); return; }

    const { data: patientData } = await supabase.from("patients").select("*").eq("robot_id", robotData.id).single();
    setPatient(patientData);
    if (!patientData) { setLoading(false); return; }

    const dayName = new Date().toLocaleDateString("ca-ES", { weekday: "long" }).toLowerCase();
    const { data: slotsData } = await supabase.from("slot_inventory").select("*").eq("robot_id", robotData.id).order("slot");
    setLoadedSlots(slotsData || []);

    const { data: medsData, error: medsError } = await supabase
      .from("dispense_schedules")
      .select("*, slot_inventory(medication_name)")
      .eq("patient_id", patientData.id)
      .eq("active", true)
      .contains("days", [dayName])
      .order("scheduled_time");

    if (medsError) console.error("Error meds:", medsError);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: todayLogs } = await supabase
      .from("dispense_logs")
      .select("schedule_id, status")
      .eq("robot_id", robotData.id)
      .gte("dispensed_at", todayStart.toISOString());

    setMeds((medsData ?? []).map(m => {
      const pastillaLog = todayLogs?.find(log => log.schedule_id === m.id);
      return { ...m, log_status: pastillaLog ? pastillaLog.status : "pending" };
    }));

    const { data: logsData } = await supabase.from("activity_logs").select("*").eq("robot_id", robotData.id).order("created_at", { ascending: false }).limit(10);
    setLogs(logsData ?? []);

    const { data: alertsData } = await supabase.from("alerts").select("*").eq("robot_id", robotData.id).order("created_at", { ascending: false });
    setAlerts(alertsData ?? []);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <DashboardHeader dark={dark} setOpen={setOpen} isReallyOnline={isReallyOnline} />
      {loading ? ( <DashboardSkeleton dark={dark} /> ) : !robot ? ( <NoRobotDialog dark={dark} />
      ) : !isReallyOnline ? (
        <OfflineDialog dark={dark} robot={robot} handleRetry={handleRetry} retrying={retrying} />
      ) : (
        <>
          <StatsRow meds={meds} alerts={alerts} dark={dark} />
          <div className="grid grid-cols-1 dash:grid-cols-3 gap-5">
            <StatusCard robot={robot} patient={patient} dark={dark} />
            <DispenseCard robot={robot} dark={dark} />
          </div>
          
          <div className="grid grid-cols-1 dash:grid-cols-3 gap-5">
            <div className="dash:col-span-2 h-full">
              <MedicationTable meds={meds} loading={false} dark={dark} />
            </div>
            <div className="h-full">
              <ScheduleForm
                loadedSlots={loadedSlots}
                existingSchedules={meds}
                dark={dark}
                onSave={async (formData) => {
                  await supabase.from("dispense_schedules").insert({
                    patient_id: patient?.id,
                    slot_inventory_id: formData.slot_inventory_id,
                    scheduled_time: formData.time,
                    days: formData.days,
                    dose: formData.dose,
                    active: true,
                    created_by: userId,
                  });
                  await fetchData();
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 dash:grid-cols-3 gap-5 items-start">
            <div className="dash:col-span-2">
              <ActivityTimeline logs={logs} loading={false} dark={dark} />
            </div>
            <NextMedPanel meds={meds} dark={dark} />
          </div>
        </>
      )}
    </div>
  );
}