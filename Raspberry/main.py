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
PENDING_FILE = "pending_logs.json"  # ⭐ NOU: cua de logs pendents

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

# ⭐ NOU (B): Funció de motor que retorna pastilles realment dispensades
def activar_motor(slot, dosi_demanada, pastilles_disponibles):
    """
    Activa el motor físic i compta quantes pastilles han caigut realment.
    Retorna: nombre real de pastilles dispensades.
    
    >>> AQUÍ POSARÀS EL TEU CODI GPIO REAL <
    De moment simulem: només pot dispensar fins al que hi ha disponible.
    """
    # Si tens un sensor òptic, aquí comptes les pastilles que detecta el sensor.
    # Si no tens sensor, fas un fallback amb min(demanat, disponible).
    pastilles_a_dispensar = min(dosi_demanada, pastilles_disponibles)
    
    for i in range(pastilles_a_dispensar):
        # >>> Aquí activaries el motor un pas (GPIO.output(pin, HIGH); time.sleep(...); LOW)
        print(f"   ⚙️  Motor: dispensant pastilla {i+1}/{pastilles_a_dispensar} del slot {slot}")
        time.sleep(1)  # simulem caiguda de cada pastilla
    
    return pastilles_a_dispensar

# ⭐ NOU (A): Gestió de la cua de logs pendents
def carregar_pendents():
    """Llegeix els logs que no s'han pogut enviar al servidor."""
    if os.path.exists(PENDING_FILE):
        try:
            with open(PENDING_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def guardar_pendents(pendents):
    """Guarda la cua de pendents al disc."""
    try:
        with open(PENDING_FILE, "w", encoding="utf-8") as f:
            json.dump(pendents, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"⚠️ Error guardant pendents: {e}")

def enviar_log_servidor(payload):
    """Intenta enviar un log al servidor. Retorna True si ho aconsegueix."""
    try:
        r = requests.post(f"{API_URL}/api/robot-action", json=payload, timeout=5)
        return r.status_code == 200
    except Exception:
        return False

def reportar_dispensacio(schedule_id, slot_inventory_id, dose_demanada, dose_real, token, status="dispensed"):
    """
    Avisa al servidor. Si no hi ha internet, encua el log per després.
    
    status pot ser:
      - 'dispensed': tot correcte
      - 'failed_inventory': no hi havia prou pastilles
    """
    payload = {
        "robot_id": ROBOT_ID,
        "robot_token": token,
        "action": "dispense",
        "payload": {
            "schedule_id": schedule_id,
            "slot_inventory_id": slot_inventory_id,
            "dose": dose_demanada,
            "dose_real": dose_real,         # ⭐ NOU (B): dosi real dispensada
            "status": status,                # ⭐ NOU (B): pot ser 'dispensed' o 'failed_inventory'
            "dispensed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
    }
    
    if enviar_log_servidor(payload):
        print(f"✅ Log enviat al servidor (real: {dose_real}/{dose_demanada}, status: {status})")
        return True
    else:
        # ⭐ NOU (A): Si falla, encuem
        pendents = carregar_pendents()
        pendents.append(payload)
        guardar_pendents(pendents)
        print(f"📦 Sense connexió. Log encuat ({len(pendents)} pendents).")
        return False

def flush_pendents():
    """Intenta enviar tots els logs pendents quan torna la connexió."""
    pendents = carregar_pendents()
    if not pendents:
        return
    
    print(f"📤 Intentant enviar {len(pendents)} logs pendents...")
    restants = []
    enviats = 0
    
    for payload in pendents:
        if enviar_log_servidor(payload):
            enviats += 1
        else:
            restants.append(payload)
    
    guardar_pendents(restants)
    
    if enviats > 0:
        print(f"   ✅ {enviats} logs pendents enviats correctament.")
    if restants:
        print(f"   ⚠️ Queden {len(restants)} pendents per enviar.")

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

# ⭐ NOU (A): Comprovem si hi ha pendents de l'última execució
pendents_inicials = carregar_pendents()
if pendents_inicials:
    print(f"📦 Hi ha {len(pendents_inicials)} logs pendents d'enviar de l'última sessió.")

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
                    
                    # ⭐ NOU (A): Aprofitem que hi ha internet per enviar pendents
                    flush_pendents()
                    
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
                dosi_demanada = s.get('dose', 1)
                slot_num = med.get('slot', '?')
                med_name = med.get('medication_name', 'Desconegut')
                pastilles_disponibles = med.get('pill_count', 0)  # ⭐ NOU (C)
                
                print(f"\n💊 HORA DE DISPENSAR! {dosi_demanada}x {med_name} del Slot {slot_num}")
                print(f"   📦 Inventari disponible al slot: {pastilles_disponibles} pastilles")
                
                # ⭐ NOU (C): Comprovació d'inventari ABANS d'activar motor
                if pastilles_disponibles < dosi_demanada:
                    print(f"   ❌ INVENTARI INSUFICIENT! Demanades {dosi_demanada}, disponibles {pastilles_disponibles}")
                    
                    # Marquem com a completat per no reintentar a cada segon
                    historial_dispensat[sch_id] = today_date_str
                    
                    # Reportem com a 'failed_inventory'
                    if token:
                        # Si hi havia alguna pastilla, dispensem el que es pugui
                        pastilles_reals = 0
                        if pastilles_disponibles > 0:
                            pastilles_reals = activar_motor(slot_num, pastilles_disponibles, pastilles_disponibles)
                            print(f"   ⚠️ S'han dispensat {pastilles_reals} pastilles (les que hi havia)")
                        
                        reportar_dispensacio(
                            sch_id, 
                            s.get('slot_inventory_id'), 
                            dosi_demanada, 
                            pastilles_reals,
                            token,
                            status="failed_inventory"
                        )
                    continue
                
                # ⭐ NOU (B): Activem motor i comptem el que cau realment
                pastilles_reals = activar_motor(slot_num, dosi_demanada, pastilles_disponibles)
                
                # Marquem l'horari com a completat avui
                historial_dispensat[sch_id] = today_date_str 
                
                # Determinem el status segons si s'ha pogut dispensar tot
                if pastilles_reals == dosi_demanada:
                    print(f"   ✅ Dispensació correcta: {pastilles_reals}/{dosi_demanada}")
                    status = "dispensed"
                else:
                    print(f"   ⚠️ Dispensació parcial: {pastilles_reals}/{dosi_demanada}")
                    status = "failed_inventory"
                
                # Avisem a la web amb la dosi REAL i el status
                if token:
                    reportar_dispensacio(
                        sch_id, 
                        s.get('slot_inventory_id'), 
                        dosi_demanada,
                        pastilles_reals,
                        token,
                        status=status
                    )

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