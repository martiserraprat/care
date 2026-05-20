import time
import threading
from datetime import datetime
from supabase import create_client
import requests

SUPABASE_URL = "https://bekapgqkbucjukigthvl.supabase.co"
SUPABASE_KEY = "sb_publishable_boGbYRPaDWRO8xunSZlSCQ_pvkRbfvG"
ROBOT_ID     = "a1b2c3d4-e5f6-7890-abcd-ef1234567892"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
res = supabase.table("patients").select("*").eq("robot_id", "a1b2c3d4-e5f6-7890-abcd-ef1234567891").execute()
print(res.data)

# ─── Horaris actius en memòria ─────────────────────────────────────────────────
schedules = []
schedules_lock = threading.Lock()

DAYS_MAP = {
    0: "dilluns",
    1: "dimarts",
    2: "dimecres",
    3: "dijous",
    4: "divendres",
    5: "dissabte",
    6: "diumenge",
}

# ─── Carregar horaris des de Supabase ─────────────────────────────────────────
def load_schedules():
    global schedules
    try:
        # Busquem el pacient del robot
        robot = supabase.table("robots").select("id").eq("id", ROBOT_ID).execute()
        if not robot.data:
            print("❌ Robot no trobat")
            return

        patient = supabase.table("patients").select("id").eq("robot_id", ROBOT_ID).execute()
        if not patient.data:
            print("⚠️ Sense pacient vinculat")
            return

        patient_id = patient.data[0]["id"]

        result = supabase.table("dispense_schedules") \
            .select("*, slot_inventory(slot, medication_name, pill_count)") \
            .eq("patient_id", patient_id) \
            .eq("active", True) \
            .execute()

        with schedules_lock:
            schedules = result.data or []

        print(f"✓ {len(schedules)} horaris carregats")
        for s in schedules:
            med = s.get("slot_inventory", {}) or {}
            print(f"  - {med.get('medication_name', '?')} | Slot {med.get('slot', '?')} | {s['scheduled_time'][:5]} | Dies: {s['days']}")

    except Exception as e:
        print(f"❌ Error carregant horaris: {e}")

# ─── Funció de dispensació ────────────────────────────────────────────────────
def dispense(schedule):
    med = schedule.get("slot_inventory", {}) or {}
    slot      = med.get("slot", "?")
    med_name  = med.get("medication_name", "Desconegut")
    dose      = schedule.get("dose", 1)
    sched_id  = schedule["id"]

    print(f"\n💊 DISPENSANT: {med_name} | Slot {slot} | Dosi: {dose}")

    # ── Aquí actives el motor físic del slot ──────────────────────────────────
    # Ex: GPIO.output(SLOT_PINS[slot], GPIO.HIGH)
    # time.sleep(2)
    # GPIO.output(SLOT_PINS[slot], GPIO.LOW)
    # ─────────────────────────────────────────────────────────────────────────

    try:
        # 1. Registrar la dispensació a dispense_logs
        supabase.table("dispense_logs").insert({
            "schedule_id":  sched_id,
            "robot_id":     ROBOT_ID,
            "status":       "dispensed",
            "dispensed_at": datetime.utcnow().isoformat(),
        }).execute()

        # 2. Reduir el comptador de pastilles
        current = med.get("pill_count", 0)
        new_count = max(0, current - dose)
        supabase.table("slot_inventory").update({
            "pill_count": new_count,
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", schedule["slot_inventory_id"]).execute()

        # 3. Crear alerta si queden poques pastilles
        if new_count <= 5:
            supabase.table("alerts").insert({
                "robot_id": ROBOT_ID,
                "type":     "medication_missed",
                "severity": "high" if new_count == 0 else "medium",
                "resolved": False,
            }).execute()
            print(f"⚠️ Alerta: queden {new_count} pastilles al slot {slot}")

        # 4. Registrar a activity_logs (visible al dashboard)
        supabase.table("activity_logs").insert({
            "robot_id":    ROBOT_ID,
            "type":        "medication",
            "description": f"Dispensat {dose} {med_name} (Slot {slot}). Restants: {new_count}",
        }).execute()

        print(f"✓ Dispensació registrada. Pastilles restants: {new_count}")

    except Exception as e:
        print(f"❌ Error registrant dispensació: {e}")

# ─── Bucle principal de comprovació d'horaris ─────────────────────────────────
def scheduler_loop():
    dispensed_today = set()  # Evita dispensar dos cops el mateix dia

    while True:
        now      = datetime.now()
        now_time = now.strftime("%H:%M")
        today    = DAYS_MAP[now.weekday()]

        # Reset a mitjanit
        if now_time == "00:00":
            dispensed_today.clear()

        with schedules_lock:
            current_schedules = list(schedules)

        for s in current_schedules:
            sched_time = s.get("scheduled_time", "")[:5]  # "HH:MM"
            days       = s.get("days", [])
            sched_id   = s["id"]

            key = f"{sched_id}_{now.date()}"

            if (
                sched_time == now_time
                and today in days
                and key not in dispensed_today
            ):
                dispensed_today.add(key)
                # Dispensa en un thread separat per no bloquejar
                threading.Thread(target=dispense, args=(s,), daemon=True).start()

        time.sleep(30)  # Comprova cada 30 segons

# ─── Realtime: escolta canvis a dispense_schedules ────────────────────────────
def start_realtime():
    def on_change(payload):
        print(f"\n🔄 Canvi detectat a horaris: {payload.get('eventType', '?')}")
        load_schedules()

    try:
        channel = supabase.channel("schedules-changes")
        channel.on(
            "postgres_changes",
            event="*",
            schema="public",
            table="dispense_schedules",
            callback=on_change
        ).subscribe()
        print("✓ Realtime actiu — escoltant canvis d'horaris")
    except Exception as e:
        print(f"⚠️ Realtime no disponible: {e}. Es recarregaran horaris cada 5 min.")
        # Fallback: recarregar cada 5 minuts
        def reload_loop():
            while True:
                time.sleep(300)
                load_schedules()
        threading.Thread(target=reload_loop, daemon=True).start()

# ─── Heartbeat ────────────────────────────────────────────────────────────────
def get_wifi_signal():
    try:
        with open("/proc/net/wireless", "r") as f:
            for line in f.readlines():
                if "wlan0" in line:
                    data = line.split()
                    link = float(data[2].replace(".", ""))
                    pct  = int((link / 70) * 100)
                    if pct >= 80: return "excellent"
                    if pct >= 50: return "good"
                    return "poor"
        return "excellent"
    except Exception:
        return "excellent"

def heartbeat_loop():
    while True:
        signal = get_wifi_signal()
        supabase.table("robots").update({
            "status":     "online",
            "signal":     signal,
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", ROBOT_ID).execute()
        print(f"Ping ✓ | Signal: {signal} | {datetime.now().strftime('%H:%M:%S')}")
        time.sleep(10)

# ─── Main ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("🤖 Care-E arrencant...")

    # 1. Carregar horaris inicials
    load_schedules()

    # 2. Iniciar realtime per detectar nous horaris
    start_realtime()

    # 3. Iniciar el scheduler en background
    threading.Thread(target=scheduler_loop, daemon=True).start()
    print("✓ Scheduler actiu")

    # 4. Heartbeat en el thread principal
    heartbeat_loop()
