# commands.py
import datetime
import requests
from config import API_URL, ROBOT_ID
from dispensing import activar_motor
from utils import reproduir_audio_base64

def processar_comandes(commands, token):
    """Processa totes les comandes manuals rebudes del servidor."""
    for cmd in commands:
        cmd_type = cmd.get("type")

        if cmd_type == "dispense_manual":
            _processar_dispense_manual(cmd, token)

        elif cmd_type == "speak":
            _processar_speak(cmd, token)

        else:
            print(f"⚠️ Tipus de comanda desconegut: {cmd_type}")

def _processar_dispense_manual(cmd, token):
    slot_info = cmd.get("slot_inventory", {})
    dose_demanada = cmd.get("dose", 1)
    slot_num = slot_info.get("slot", "?")
    med_name = slot_info.get("medication_name", "Desconegut")
    pastilles_disponibles = slot_info.get("pill_count", 0)

    print(f"\n🎮 ORDRE MANUAL: {dose_demanada}x {med_name} del Slot {slot_num}")

    if pastilles_disponibles < dose_demanada:
        print(f"   ❌ Inventari insuficient ({pastilles_disponibles}/{dose_demanada})")
        pastilles_reals = activar_motor(slot_num, pastilles_disponibles, pastilles_disponibles) if pastilles_disponibles > 0 else 0
        status = "failed_inventory"
    else:
        pastilles_reals = activar_motor(slot_num, dose_demanada, pastilles_disponibles)
        status = "dispensed" if pastilles_reals == dose_demanada else "failed_inventory"

    try:
        requests.post(f"{API_URL}/api/robot-action", json={
            "robot_id": ROBOT_ID,
            "robot_token": token,
            "action": "dispense",
            "payload": {
                "schedule_id": None,
                "slot_inventory_id": cmd.get("slot_inventory_id"),
                "dose": dose_demanada,
                "dose_real": pastilles_reals,
                "status": status,
                "command_id": cmd.get("id"),
                "dispensed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            }
        }, timeout=5)
        print(f"   ✅ Resultat reportat: {pastilles_reals}/{dose_demanada}")
    except Exception as e:
        print(f"   ⚠️ Error reportant: {e}")

def _processar_speak(cmd, token):
    message_text = cmd.get("message_text", "")
    audio_b64 = cmd.get("audio_base64")

    print(f"\n🔊 MISSATGE DEL CUIDADOR: \"{message_text}\"")

    if not audio_b64:
        print("   ❌ No hi ha àudio")
        _reportar_speak(cmd.get("id"), token, ok=False, error="No s'ha rebut àudio")
        return

    ok = reproduir_audio_base64(audio_b64)
    print(f"   {'✅ Reproduït' if ok else '❌ Error reproduint'}")
    _reportar_speak(cmd.get("id"), token, ok=ok, error="Error reproduint àudio" if not ok else None)

def _reportar_speak(command_id, token, ok, error=None):
    try:
        requests.post(f"{API_URL}/api/robot-action", json={
            "robot_id": ROBOT_ID,
            "robot_token": token,
            "action": "speak",
            "payload": {
                "command_id": command_id,
                "status": "ok" if ok else "failed",
                "error_message": error,
            }
        }, timeout=5)
    except Exception as e:
        print(f"   ⚠️ Error reportant speak: {e}")