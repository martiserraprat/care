# utils.py
import os
import json
import base64
import subprocess
import requests
from config import API_URL, PENDING_FILE
import sounddevice as sd
import numpy as np
from scipy.io.wavfile import write

SAMPLE_RATE = 48000
MIC_DEVICE  = 1   # USB PnP Audio Device
AMP_DEVICE  = 0   # Google Voice HAT
ALSA_DEVICE = 'hw:0,0'  # Per sox/play

def get_wifi_signal():
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
    """Reprodueix MP3 a través d'ALSA directament (sense PulseAudio)."""
    try:
        audio_bytes = base64.b64decode(audio_b64)
        temp_path = os.path.join(os.getcwd(), "temp_audio.mp3")
        with open(temp_path, "wb") as f:
            f.write(audio_bytes)
        print(f"🎵 Fitxer guardat: {temp_path}")

        # Força a sox a usar ALSA directament al Voice HAT
        env = os.environ.copy()
        env['AUDIODEV']    = ALSA_DEVICE
        env['AUDIODRIVER'] = 'alsa'

        result = subprocess.run(
            ['play', '-q', '-t', 'mp3', temp_path, 'vol', '5'],
            env=env,
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            # Fallback: mpg123 directe
            print(f"⚠️ sox falla, provant mpg123...")
            subprocess.run(['mpg123', '-q', '-a', ALSA_DEVICE, temp_path], check=True)

        os.remove(temp_path)
        print("✅ Reproduït correctament")
        return True

    except Exception as e:
        import traceback
        print(f"⚠️ Error: {traceback.format_exc()}")
        return False

def gravar_fins_silenci(max_durada=30, silenci_llindar=780, silenci_durada=1.5):
    import time
    time.sleep(0.8)
    print("🔔 [BIP INICIAL]")
    fer_bip(tipus="inici")
    print("🎤 Escoltant... (para de parlar per enviar)")

    chunk_size = 1024
    chunks = []
    chunks_silence = 0
    chunks_per_second = SAMPLE_RATE / chunk_size
    max_silence_chunks = int(silenci_durada * chunks_per_second)
    max_chunks = int(max_durada * chunks_per_second)
    ha_parlat = False

    with sd.InputStream(
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype='int16',
        blocksize=chunk_size,
        device=MIC_DEVICE
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
                        print(f"\n🔇 Silenci detectat, tallant...")
                        break
    print("🔕 [BIP FINAL]")
    fer_bip(tipus="fi")

    audio = np.concatenate(chunks, axis=0)
    fitxer = "veu_pacient.wav"
    write(fitxer, SAMPLE_RATE, audio)
    durada_real = len(audio) / SAMPLE_RATE
    print(f"✅ Gravació acabada: {durada_real:.1f} segons")
    return fitxer

def fer_bip(tipus="inici"):
    try:
        silenci_inicial = np.zeros(int(SAMPLE_RATE * 0.15), dtype=np.float64)

        def crea_nota(freq, durada):
            t = np.linspace(0, durada, int(SAMPLE_RATE * durada), False)
            ona = (0.6 * np.sin(2 * np.pi * freq * t) +
                   0.3 * np.sin(2 * np.pi * (freq * 2) * t) +
                   0.1 * np.sin(2 * np.pi * (freq * 3) * t))
            fade_len = int(SAMPLE_RATE * 0.02)
            envelope = np.ones_like(t)
            envelope[:fade_len] = np.linspace(0, 1, fade_len)
            envelope[-fade_len:] = np.linspace(1, 0, fade_len)
            return ona * envelope

        freq_greu = 587.33
        freq_aguda = 739.99

        if tipus == "inici":
            nota1 = crea_nota(freq_greu, 0.1)
            silenci_mig = np.zeros(int(SAMPLE_RATE * 0.04))
            nota2 = crea_nota(freq_aguda, 0.15)
        else:
            nota1 = crea_nota(freq_aguda, 0.1)
            silenci_mig = np.zeros(int(SAMPLE_RATE * 0.04))
            nota2 = crea_nota(freq_greu, 0.15)

        audio_combinat = np.concatenate((silenci_inicial, nota1, silenci_mig, nota2))
        audio_final = (audio_combinat * 20000).astype(np.int16)

        sd.play(audio_final, SAMPLE_RATE, device=AMP_DEVICE)
        sd.wait()
    except Exception as e:
        print(f"⚠️ No s'ha pogut reproduir el bip: {e}")