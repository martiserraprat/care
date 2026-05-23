# utils.py
import os
import json
import base64
import tempfile
import subprocess
import requests
import sys
from config import API_URL, PENDING_FILE
import sounddevice as sd
import numpy as np
from scipy.io.wavfile import write

SAMPLE_RATE = 16000

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
    try:
        audio_bytes = base64.b64decode(audio_b64)
        
        # ⭐ Ruta fixa en lloc de tempfile (evita problemes a Windows)
        temp_path = os.path.join(os.getcwd(), "temp_audio.mp3")
        
        with open(temp_path, "wb") as f:
            f.write(audio_bytes)
        
        print(f"🎵 Fitxer guardat: {temp_path}")
        
        import pygame
        pygame.mixer.init()
        pygame.mixer.music.load(temp_path)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
        pygame.mixer.quit()
        
        os.remove(temp_path)
        print("✅ Reproduït correctament")
        return True
        
    except Exception as e:
        import traceback
        print(f"⚠️ Error: {traceback.format_exc()}")
        return False

def gravar_fins_silenci(
    max_durada=30,          # màxim 30 segons per si de cas
    silenci_llindar=750,    # volum mínim per considerar silenci (ajusta si cal)
    silenci_durada=1.5,     # segons de silenci per tallar
):
    """
    Grava àudio fins que detecta silenci prolongat.
    Retorna la ruta del fitxer WAV gravat.
    """
    print("🎤 Escoltant... (para de parlar per enviar)")
    
    chunk_size = 1024
    chunks = []
    chunks_silence = 0
    chunks_per_second = SAMPLE_RATE / chunk_size
    max_silence_chunks = int(silenci_durada * chunks_per_second)
    max_chunks = int(max_durada * chunks_per_second)
    ha_parlat = False  # evitar tallar si no ha dit res encara

    with sd.InputStream(
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype='int16',
        blocksize=chunk_size
    ) as stream:
        for _ in range(max_chunks):
            chunk, _ = stream.read(chunk_size)
            chunks.append(chunk.copy())

            volum = np.abs(chunk).mean()

            if volum > silenci_llindar:
                ha_parlat = True
                chunks_silence = 0
            else:
                if ha_parlat:
                    chunks_silence += 1
                    if chunks_silence >= max_silence_chunks:
                        print(f"🔇 Silenci detectat, tallant...")
                        break

    audio = np.concatenate(chunks, axis=0)

    fitxer = "veu_pacient.wav"
    write(fitxer, SAMPLE_RATE, audio)
    durada_real = len(audio) / SAMPLE_RATE
    print(f"✅ Gravació acabada: {durada_real:.1f} segons")
    return fitxer
