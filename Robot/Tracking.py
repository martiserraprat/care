#!/usr/bin/env python3
"""
Robot Seguidor de Persona
=========================
Camera REAL + YOLO REAL + Motors SIMULATS (prints)
Stream en viu al navegador: http://IP_RASPI:5000
"""

import cv2
import time
import random
import threading
from picamera2 import Picamera2
from ultralytics import YOLO
from flask import Flask, Response

# ─────────────────────────────────────────
# CONFIGURACIO
# ─────────────────────────────────────────
FRAME_W = 1280          # resolucio mes gran (es veu millor)
FRAME_H = 720
YOLO_SIZE = 320        # YOLO processa a mida reduida (mes rapid)

# Distancia: amplada del bounding box en px
DIST_OBJECTIU = 340    # era 170, x2
DIST_MARGE = 120       # era 60, x2

CENTRE_MARGE = 120     # era 60, x2

US_THRESHOLD_CM = 30
KP_TURN = 0.25         # guany gir
KP_SPEED = 0.20        # guany velocitat
VEL_MAX = 80           # velocitat maxima motors (%)
VEL_BUSCAR = 30        # velocitat girant per buscar

# ─────────────────────────────────────────
# ESTAT COMPARTIT
# ─────────────────────────────────────────
estat = {
    "persona_x": None,
    "persona_amplada": None,
    "persona_detectada": False,
    "persona_box": None,
    "persona_conf": 0,
    "us_frontal_cm": 100,
    "motor_L": 0,
    "motor_R": 0,
    "accio": "INICIANT",
    "frame_anotat": None,
    "fps": 0,
    "running": True
}
lock = threading.Lock()

# ─────────────────────────────────────────
# SIMULACIO SERIAL (substituir per Arduino real)
# ─────────────────────────────────────────
def enviar_motors(vel_L, vel_R):
    with lock:
        estat["motor_L"] = vel_L
        estat["motor_R"] = vel_R
    # ROBOT REAL: serial.write(f"M:{vel_L:.0f}:{vel_R:.0f}\n".encode())
    print(f"  [SERIAL->ARDUINO] L={vel_L:+.0f}%  R={vel_R:+.0f}%")

def enviar_parada():
    print("  [SERIAL->ARDUINO] PARADA")

# ─────────────────────────────────────────
# THREAD 1: CAMERA + YOLO
# ─────────────────────────────────────────
def thread_visio(picam, model):
    print("[VISIO] Thread iniciat")
    t_prev = time.time()

    while estat["running"]:
        frame = picam.capture_array()
        frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)

        resultats = model(frame_bgr, imgsz=YOLO_SIZE, conf=0.5,
                          classes=[0], verbose=False)

        persona_trobada = False
        millor_box = None
        millor_area = 0
        millor_conf = 0

        for r in resultats:
            for box in r.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                area = (x2 - x1) * (y2 - y1)
                if area > millor_area:
                    millor_area = area
                    millor_box = (x1, y1, x2, y2)
                    millor_conf = float(box.conf[0])
                    persona_trobada = True

        # FPS
        t_now = time.time()
        fps = 1.0 / (t_now - t_prev) if t_now > t_prev else 0
        t_prev = t_now

        with lock:
            estat["fps"] = fps
            if persona_trobada and millor_box:
                x1, y1, x2, y2 = [int(v) for v in millor_box]
                estat["persona_x"] = (x1 + x2) / 2
                estat["persona_amplada"] = x2 - x1
                estat["persona_detectada"] = True
                estat["persona_box"] = (x1, y1, x2, y2)
                estat["persona_conf"] = millor_conf
            else:
                estat["persona_detectada"] = False
                estat["persona_x"] = None
                estat["persona_amplada"] = None
                estat["persona_box"] = None
                estat["persona_conf"] = 0

            # Generem el frame anotat
            estat["frame_anotat"] = dibuixar_hud(frame_bgr)

        time.sleep(0.01)

# ─────────────────────────────────────────
# DIBUIX HUD
# ─────────────────────────────────────────
def dibuixar_hud(frame):
    vis = frame.copy()
    cx_img = FRAME_W // 2

    # Línia centre camera (groga)
    cv2.line(vis, (cx_img, 0), (cx_img, FRAME_H), (0, 255, 255), 1)

    # Zona morta de centrat (rectangle gris)
    cv2.rectangle(vis, (cx_img - CENTRE_MARGE, 0),
                  (cx_img + CENTRE_MARGE, FRAME_H), (100, 100, 100), 1)

    box = estat["persona_box"]
    if box:
        x1, y1, x2, y2 = box
        cy = (y1 + y2) // 2
        cx = (x1 + x2) // 2

        # Color segons si esta centrada
        error_x = cx - cx_img
        centrada = abs(error_x) < CENTRE_MARGE
        color = (0, 255, 0) if centrada else (0, 165, 255)

        cv2.rectangle(vis, (x1, y1), (x2, y2), color, 2)
        cv2.putText(vis, f"Persona {estat['persona_conf']:.2f}",
                    (x1, y1 - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        cv2.circle(vis, (cx, cy), 6, color, -1)
        cv2.line(vis, (cx_img, cy), (cx, cy), color, 2)

    # Barra inferior amb info
    accio = estat["accio"]
    color_accio = (0, 255, 0)
    if "OBSTACLE" in accio:
        color_accio = (0, 0, 255)
    elif "Buscant" in accio:
        color_accio = (0, 165, 255)
    elif "STOP" in accio or "OK" in accio:
        color_accio = (0, 255, 0)

    # Fons negre semitransparent a dalt
    overlay = vis.copy()
    cv2.rectangle(overlay, (0, 0), (FRAME_W, 70), (0, 0, 0), -1)
    vis = cv2.addWeighted(overlay, 0.5, vis, 0.5, 0)

    cv2.putText(vis, accio, (10, 25),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, color_accio, 2)
    cv2.putText(vis, f"Motors  L:{estat['motor_L']:+.0f}%  R:{estat['motor_R']:+.0f}%",
                (10, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    cv2.putText(vis, f"US:{estat['us_frontal_cm']:.0f}cm  FPS:{estat['fps']:.1f}",
                (10, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

    return vis

# ─────────────────────────────────────────
# THREAD 2: ULTRASONS SIMULATS
# ─────────────────────────────────────────
def thread_ultrasons():
    print("[ULTRASONS] Thread iniciat (simulat)")
    while estat["running"]:
        # ROBOT REAL: distancia = mesurar_ultrasò()
        # De moment sempre lluny per no interferir amb les proves
        distancia = random.uniform(80, 150)
        with lock:
            estat["us_frontal_cm"] = distancia
        time.sleep(0.1)

# ─────────────────────────────────────────
# THREAD 3: CONTROL PID
# ─────────────────────────────────────────
def thread_control():
    print("[CONTROL] Thread iniciat")
    cx_img = FRAME_W / 2

    while estat["running"]:
        with lock:
            detectada = estat["persona_detectada"]
            px = estat["persona_x"]
            amplada = estat["persona_amplada"]
            us_cm = estat["us_frontal_cm"]

        # ── PRIORITAT 1: Obstacle ──
        if us_cm < US_THRESHOLD_CM:
            accio = f"OBSTACLE {us_cm:.0f}cm"
            enviar_motors(-30, 30)
            with lock:
                estat["accio"] = accio
            print(f"[CONTROL] {accio}")
            time.sleep(0.1)
            continue

        # ── PRIORITAT 2: Seguir persona ──
        if detectada and px is not None:
            error_x = px - cx_img            # >0 persona a la dreta
            error_dist = amplada - DIST_OBJECTIU  # >0 massa aprop

            centrada = abs(error_x) < CENTRE_MARGE
            bona_dist = abs(error_dist) < DIST_MARGE

            # ── QUIET si esta centrada I a bona distancia ──
            if centrada and bona_dist:
                accio = "OK - quiet (centrada i bona dist.)"
                enviar_motors(0, 0)

            else:
                # Calcul gir (proporcional a error horitzontal)
                gir = 0
                if not centrada:
                    gir = KP_TURN * error_x / cx_img * VEL_MAX

                # Calcul avanc (proporcional a error distancia)
                avanc = 0
                if not bona_dist:
                    # massa aprop (error_dist>0) -> recula (avanc negatiu)
                    avanc = -KP_SPEED * error_dist / DIST_OBJECTIU * VEL_MAX

                vel_L = max(-VEL_MAX, min(VEL_MAX, avanc + gir))
                vel_R = max(-VEL_MAX, min(VEL_MAX, avanc - gir))

                if not centrada and bona_dist:
                    accio = "GIRANT cap persona"
                elif centrada and error_dist < 0:
                    accio = "AVANCANT"
                elif centrada and error_dist > 0:
                    accio = "RECULANT"
                else:
                    accio = "AJUSTANT"

                enviar_motors(vel_L, vel_R)

            with lock:
                estat["accio"] = accio
            print(f"[CONTROL] {accio} | error_x={error_x:+.0f} error_dist={error_dist:+.0f}")

        # ── PRIORITAT 3: No hi ha ningu -> QUIET ──
        else:
            accio = "Ningu detectat - quiet"
            enviar_motors(0, 0)
            with lock:
                estat["accio"] = accio
            print(f"[CONTROL] {accio}")

        time.sleep(0.1)

# ─────────────────────────────────────────
# FLASK STREAM
# ─────────────────────────────────────────
app = Flask(__name__)

def gen_frames():
    while True:
        with lock:
            frame = estat.get("frame_anotat")
        if frame is not None:
            ok, jpg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            if ok:
                yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n'
                       + jpg.tobytes() + b'\r\n')
        time.sleep(0.03)

@app.route('/video')
def video():
    return Response(gen_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/')
def index():
    return '''
    <!DOCTYPE html>
    <html><head><meta charset="utf-8">
    <title>Robot Seguidor</title>
    <style>
      body{background:#0a0a0a;color:#eee;font-family:sans-serif;
           text-align:center;margin:0;padding:20px}
      h2{font-weight:400;color:#0f0}
      img{width:90vw;max-width:900px;border-radius:8px;
          border:2px solid #0f0;margin-top:10px}
    </style></head>
    <body>
      <h2>Robot Seguidor de Persona</h2>
      <img src="/video">
    </body></html>
    '''

# ─────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────
def main():
    print("=" * 50)
    print("  ROBOT SEGUIDOR DE PERSONA")
    print("  Stream: http://IP_RASPI:5000")
    print("=" * 50)

    print("\n[INIT] Carregant camera...")
    picam = Picamera2()
    picam.configure(picam.create_video_configuration(
        main={"size": (FRAME_W, FRAME_H), "format": "RGB888"},
        controls={"FrameRate": 30}
    ))
    picam.start()
    time.sleep(1)
    print("[INIT] Camera OK")

    print("[INIT] Carregant YOLOv8n...")
    model = YOLO("yolov8n.pt")
    print("[INIT] YOLO OK\n")

    threading.Thread(target=thread_visio, args=(picam, model), daemon=True).start()
    threading.Thread(target=thread_ultrasons, daemon=True).start()
    threading.Thread(target=thread_control, daemon=True).start()

    try:
        app.run(host='0.0.0.0', port=5000, threaded=True)
    except KeyboardInterrupt:
        pass
    finally:
        print("\n[STOP] Aturant robot...")
        estat["running"] = False
        enviar_parada()
        picam.stop()
        print("[STOP] Fins aviat!")

if __name__ == "__main__":
    main()
