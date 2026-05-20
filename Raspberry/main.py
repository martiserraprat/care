import time
import datetime
import requests
import json
import os
from supabase import create_client

# ─── Configuració ────────────────────────────────────────────────────────────
SUPABASE_URL = "https://bekapgqkbucjukigthvl.supabase.co"
SUPABASE_KEY = "sb_publishable_boGbYRPaDWRO8xunSZlSCQ_pvkRbfvG"
API_URL      = "http://localhost:3000"  # En producció posa la IP del teu servidor o domini
ROBOT_ID     = "a1b2c3d4-e5f6-7890-abcd-ef1234567895"
LOCAL_FILE   = "schedules.json"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Diccionari per traduir els dies de Python (0=Dilluns) als teus de la BD
DIES_CAT = ["dilluns", "dimarts", "dimecres", "dijous", "divendres", "dissabte", "diumenge"]

# ─── Funcions de Memòria Local i Xarxa ───────────────────────────────────────
def save_schedules_local(schedules):
    """Guarda els horaris al disc dur del robot (targeta SD)."""
    try:
        with open(LOCAL_FILE, "w", encoding="utf-8") as f:
            json.dump(schedules, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"⚠️ Error guardant en local: {e}")

def load_schedules_local():
    """Llegeix els horaris del disc dur si n'hi ha."""
    if os.path.exists(LOCAL_FILE):
        try:
            with open(LOCAL_FILE, "r", encoding="utf-8") as f:
                dades = json.load(f)
                print(f"📁 Carregats {len(dades)} horaris de la memòria local (Mode Offline).")
                return dades
        except Exception as e:
            print(f"⚠️ Error llegint fitxer local: {e}")
    return []

def get_wifi_signal():
    """Llegeix la qualitat del senyal Wi-Fi intern de la Raspberry Pi."""
    try:
        with open("/proc/net/wireless", "r") as f:
            lines = f.readlines()
            for line in lines:
                if "wlan0" in line:
                    data = line.split()
                    link_quality = float(data[2].replace(".", ""))
                    percentage = int((link_quality / 70) * 100)
                    if percentage >= 80: return "excellent"
                    if percentage >= 50: return "good"
                    if percentage >= 20: return "fair"
                    return "poor"
        return "no signal"
    except Exception:
        return "excellent"

def reportar_dispensacio(schedule_id, slot_inventory_id, dose, token):
    """Avisa al servidor que s'ha dispensat per guardar el log i restar inventari."""
    try:
        r = requests.post(f"{API_URL}/api/robot-action", json={
            "robot_id": ROBOT_ID,
            "robot_token": token,
            "action": "dispense",
            "payload": {
                "schedule_id": schedule_id,
                "slot_inventory_id": slot_inventory_id,
                "dose": dose
            }
        }, timeout=5)
        
        if r.status_code == 200:
            print("✅ Web actualitzada: Log creat i pastilla restada de l'inventari.")
        else:
            print(f"⚠️ Error actualitzant la web: HTTP {r.status_code}")
    except Exception as e:
        print(f"⚠️ Sense internet per avisar a la web: {e}")

# ─── Inicialització del Robot ────────────────────────────────────────────────
res = supabase.table("robots").select("id, owner_id, name, robot_token").eq("id", ROBOT_ID).execute()
token = None

if not res.data:
    supabase.table("robots").insert({
        "id":     ROBOT_ID,
        "name":   "Care-E",
        "status": "offline",
    }).execute()
    print("=" * 40 + f"\n  Care-E Robot ID:\n  {ROBOT_ID}\n" + "=" * 40)
    print("Introdueix aquest ID a la web per vincul·lar el robot.")
else:
    robot = res.data[0]
    token = robot.get("robot_token")
    if robot.get("owner_id"):
        print(f"✓ Care-E funcionant correctament | Robot: {robot.get('name', 'Care-E')}")
    else:
        print("Esperant que l'usuari vinculi el robot a la web...")

# --- Carreguem el backup local abans de començar ---
current_schedules = load_schedules_local()
last_sync_time = 0

# Memòria per no repetir pastilles el mateix dia: {"id_horari": "2026-05-20"}
historial_dispensat = {}

print("\nIniciant heartbeat i comprovació d'horaris...")

# ─── Bucle Principal ─────────────────────────────────────────────────────────
while True:
    now = time.time()
    
    # --- A) Sincronització via API (cada 60 segons) ---
    if now - last_sync_time > 60:
        if token:
            try:
                r = requests.post(f"{API_URL}/api/robot-info", json={
                    "robot_id": ROBOT_ID, "robot_token": token
                }, timeout=5)
                
                if r.status_code == 200:
                    data = r.json()
                    nous_horaris = data.get("schedules") or []
                    
                    # Només guardem al disc si els horaris han canviat
                    if nous_horaris != current_schedules:
                        current_schedules = nous_horaris
                        save_schedules_local(current_schedules)
                        print(f"✅ Nous horaris detectats i guardats en local: {len(current_schedules)} actius.")
                    
                    last_sync_time = now
            except Exception as e:
                print(f"⚠️ Sense internet. Funcionant amb la memòria local. ({e})")
        else:
            # Si no hi ha token, intentem llegir-lo de la BD per si s'acaba de vincular
            refresh = supabase.table("robots").select("robot_token").eq("id", ROBOT_ID).execute()
            if refresh.data and refresh.data[0].get("robot_token"):
                token = refresh.data[0].get("robot_token")
                print("🎉 Robot vinculat exitosament! Començant sincronització...")

    # --- B) Comprovació de dispensació ---
    current_time_str = time.strftime("%H:%M")
    today_date_str = time.strftime("%Y-%m-%d")
    today_weekday = DIES_CAT[datetime.datetime.today().weekday()]

    for s in current_schedules:
        sch_id = s.get('id')
        sch_time = s.get('scheduled_time', '')[:5]
        dies_programats = s.get('days', [])
        
        # Comprovem: Hora + Dia de la setmana
        if sch_time == current_time_str and today_weekday in dies_programats:
            
            # Comprovem que no s'hagi dispensat ja avui
            if historial_dispensat.get(sch_id) != today_date_str:
                
                # --- ACCIÓ DE DISPENSAR ---
                med = s.get('slot_inventory', {})
                dosi = s.get('dose', 1)
                
                print(f"💊 ACTIVANT MOTOR! Dispensant {dosi}x {med.get('medication_name')} del Slot {med.get('slot')}")
                
                # >>> AQUI POSARÀS EL TEU CODI DE MOTOR (GPIO) <<<
                time.sleep(2) # Simulem temps de caiguda de la pastilla
                
                # Marquem l'horari com a completat avui
                historial_dispensat[sch_id] = today_date_str 
                
                # Avisem a la web per registrar el log i restar la pastilla
                if token:
                    reportar_dispensacio(sch_id, s.get('slot_inventory_id'), dosi, token)

    # --- C) Heartbeat amb senyal dinàmica (cada 10 segons) ---
    current_signal = get_wifi_signal()
    try:
        supabase.table("robots").update({
            "status":  "online",
            "battery": None,
            "signal":  current_signal,
        }).eq("id", ROBOT_ID).execute()
        
        print(f"Ping ✓ | Signal: {current_signal} | {time.strftime('%H:%M:%S')}")
    except Exception as e:
        # Falla en silenci si no hi ha internet, el robot segueix funcionant localment
        pass 
    
    time.sleep(10)