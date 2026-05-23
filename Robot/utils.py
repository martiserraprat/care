# utils.py
import os
import json
import base64
import tempfile
import subprocess
import requests
from config import API_URL, ROBOT_ID, PENDING_FILE

def get_wifi_signal():
    """Llegeix la qualitat del senyal Wi-Fi intern de la Raspberry Pi."""
    try:
        with open("/proc/net/wireless", "r") as f:
            for line in f.readlines():
                if "wlan0" in line:
                    data = line.split()
                    quality = float(data[2].replace(".", ""))
                    pct = int((quality / 70) * 100)
                    if pct >= 80: return "excellent"
                    if pct >= 50: return "good"
                    if pct >= 20: return "fair"
                    return "poor"
        return "no signal"
    except Exception:
        return "excellent"

def carregar_pendents():
    if os.path.exists(PENDING_FILE):
        try:
            with open(PENDING_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def guardar_pendents(pendents):
    try:
        with open(PENDING_FILE, "w", encoding="utf-8") as f:
            json.dump(pendents, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"⚠️ Error guardant pendents: {e}")

def enviar_log_servidor(payload):
    try:
        r = requests.post(f"{API_URL}/api/robot-action", json=payload, timeout=5)
        return r.status_code == 200
    except Exception:
        return False

def flush_pendents():
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
        print(f"   ✅ {enviats} logs pendents enviats.")
    if restants:
        print(f"   ⚠️ Queden {len(restants)} pendents.")

def reproduir_audio_base64(audio_b64):
    """Descodifica base64 i reprodueix l'MP3."""
    try:
        audio_bytes = base64.b64decode(audio_b64)
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
            f.write(audio_bytes)
            temp_path = f.name
        subprocess.run(["mpg123", "-q", temp_path], check=True)
        os.remove(temp_path)
        return True
    except Exception as e:
        print(f"⚠️ Error reproduint àudio: {e}")
        return False