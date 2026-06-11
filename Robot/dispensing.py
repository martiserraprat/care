# dispensing.py
# Gestiona la lògica de dispensació de pastilles del robot Care-E.
# S'encarrega d'activar els motors, reportar els resultats al cloud
# i encuar els logs si no hi ha connexió a internet.
import time
import datetime
import requests
from config import API_URL, ROBOT_ID
from utils import carregar_pendents, guardar_pendents, enviar_log_servidor

def activar_motor(slot, dosi_demanada, pastilles_disponibles):
    """
    Activa el motor del slot indicat i retorna les pastilles realment dispensades.
    Aquí s'ha d'afegir el codi GPIO real per controlar els motors via Arduino.
    """
    # Dispensa el mínim entre les demanades i les disponibles
    pastilles_a_dispensar = min(dosi_demanada, pastilles_disponibles)
    for i in range(pastilles_a_dispensar):
        print(f"   ⚙️  Motor: pastilla {i+1}/{pastilles_a_dispensar} del slot {slot}")
        time.sleep(1)  # Espera que el motor acabi el cicle de dispensació
    return pastilles_a_dispensar

def reportar_dispensacio(schedule_id, slot_inventory_id, dose_demanada, dose_real, token, status="dispensed"):
    """Envia el log al servidor. Si falla per manca de connexió, l'encua per enviar després."""
    payload = {
        "robot_id": ROBOT_ID,
        "robot_token": token,
        "action": "dispense",
        "payload": {
            "schedule_id": schedule_id,
            "slot_inventory_id": slot_inventory_id,
            "dose": dose_demanada,
            "dose_real": dose_real,
            "status": status,
            "dispensed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
    }

    if enviar_log_servidor(payload):
        print(f"✅ Log enviat (real: {dose_real}/{dose_demanada}, status: {status})")
        return True
    else:
        # Si no hi ha internet, guarda el log localment per enviar-lo quan es recuperi la connexió
        pendents = carregar_pendents()
        pendents.append(payload)
        guardar_pendents(pendents)
        print(f"📦 Sense connexió. Log encuat ({len(pendents)} pendents).")
        return False

def processar_schedule(s, token, historial_dispensat, today_date_str, current_time_str, today_weekday):
    """Comprova si toca dispensar en aquest minut i ho fa si cal."""
    sch_id = s.get('id')
    sch_time = s.get('scheduled_time', '')[:5]  # Format HH:MM
    dies_programats = s.get('days', [])

    # Surt si l'hora o el dia no coincideixen
    if sch_time != current_time_str or today_weekday not in dies_programats:
        return

    # Evita dispensar dues vegades el mateix horari en el mateix dia
    if historial_dispensat.get(sch_id) == today_date_str:
        return

    med = s.get('slot_inventory', {})
    dosi_demanada = s.get('dose', 1)
    slot_num = med.get('slot', '?')
    med_name = med.get('medication_name', 'Desconegut')
    pastilles_disponibles = med.get('pill_count', 0)

    print(f"\n💊 HORA DE DISPENSAR! {dosi_demanada}x {med_name} del Slot {slot_num}")
    print(f"   📦 Inventari: {pastilles_disponibles} pastilles")

    # Marca com dispensat per evitar repeticions durant el mateix minut
    historial_dispensat[sch_id] = today_date_str

    # Si no hi ha prou pastilles, dispensa les que queden i reporta error d'inventari
    if pastilles_disponibles < dosi_demanada:
        print(f"   ❌ INVENTARI INSUFICIENT! ({pastilles_disponibles}/{dosi_demanada})")
        pastilles_reals = 0
        if pastilles_disponibles > 0:
            pastilles_reals = activar_motor(slot_num, pastilles_disponibles, pastilles_disponibles)
        if token:
            reportar_dispensacio(sch_id, s.get('slot_inventory_id'), dosi_demanada, pastilles_reals, token, "failed_inventory")
        return

    # Dispensació normal
    pastilles_reals = activar_motor(slot_num, dosi_demanada, pastilles_disponibles)
    status = "dispensed" if pastilles_reals == dosi_demanada else "failed_inventory"
    print(f"   {'✅' if status == 'dispensed' else '⚠️'} {pastilles_reals}/{dosi_demanada}")

    # Reporta el resultat al cloud (o encua si no hi ha connexió)
    if token:
        reportar_dispensacio(sch_id, s.get('slot_inventory_id'), dosi_demanada, pastilles_reals, token, status)