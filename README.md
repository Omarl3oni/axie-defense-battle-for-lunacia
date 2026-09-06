# Axie Defense: Battle for Lunacia 🏰🛡️

**Axie Defense: Battle for Lunacia** es un videojuego **Tower Defense 3D** para navegadores web desarrollado específicamente para el evento oficial **Sky Mavis Axie Vibeathon 2026**.

Inspirado en los clásicos del género como *Kingdom Rush* y *Bloons TD*, el jugador debe defender el **Árbol Ancestral de Lunacia** colocando y mejorando estratégicamente torres Axie en plataformas a lo largo de un camino sinuoso por el que avanzan oleadas de quimeras y Sapidae.

---

## 🎮 Jugabilidad y Roles Tácticos

### 1. Torres Axie Defensivas
* 🍅 **Pomodoro (Clase Planta - 100 ⚡):**
  * *Rol:* Fuego rápido y veneno continuo.
  * Dispara ráfagas de semillas punzantes. A partir de Nivel 2, infecta a los enemigos con esporas venenosas que infligen daño continuo ignorando armaduras.
* 🦊 **Kotaro (Clase Bestia - 150 ⚡):**
  * *Rol:* Asesino de tanques y daño masivo.
  * Cuchilladas feroces con 35% de probabilidad de golpe crítico devastador (x2.5 daño). Indispensable para frenar a las quimeras acorazadas.
* 🌊 **Bing (Clase Aqua - 175 ⚡):**
  * *Rol:* Mortero de agua, daño en área y ralentización (*Splash & Slow*).
  * Lanza proyectiles explosivos que impactan en grupos de monstruos, reduciendo su velocidad de avance un 45%.
* 🪶 **Tripp (Clase Pájaro - 200 ⚡):**
  * *Rol:* Francotirador de largo alcance.
  * Cobertura de casi todo el mapa; prioriza a las quimeras más adelantadas que intentan escapar hacia el Árbol Ancestral.

### 2. Inspección y Mejoras de Torre
* Haz clic en cualquier torre construida para ver su **círculo de rango 3D** en el suelo.
* **Mejorar (Nivel 2 y Nivel 3):** Aumenta el daño en +65%, expande el rango y desbloquea auras luminosas y doradas.
* **Vender:** Recupera el 70% del valor total invertido en cualquier momento.

### 3. Poder Activo de Emergencia
* ☄️ **Lluvia de Espinas (Cooldown 25s):**
  * Activa la habilidad y haz clic en cualquier parte del camino para descargar un bombardeo de 180 de daño en área contra aglomeraciones de quimeras.

### 4. 10 Oleadas y Control de Velocidad
* **Control de Oleadas:** Decide cuándo empezar cada ola con el botón "¡INICIAR OLEADA!".
* **Velocidad de Juego (⏩ x1 / x2):** Acelera el combate para un ritmo más trepidante.
* **Ola 10:** El enfrentamiento final contra la **Reina Quimera Ancestral**.

---

## 🛠️ Stack Tecnológico (60 FPS Garantizados)

* **Cero Lag:** A diferencia de los juegos de supervivencia con colisiones erráticas, los enemigos siguen una trayectoria de waypoints limpia mediante curvas Catmull-Rom. El consumo de CPU/GPU es mínimo y mantiene **60 FPS rocosos en cualquier PC o móvil**.
* **Motor 3D:** [Three.js](https://threejs.org/) con modelos `.glb` oficiales de Axie, sombras dinámicas y shaders optimizados.
* **Entorno:** [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/).
* **Audio Procedural:** Efectos sonoros y sintetizador con Web Audio API.

---

## ⚖️ Divulgación de Recursos, IA y Licencias (Regla 4 del Vibeathon)

* **Assets 3D Oficiales:** Modelos `.glb` animados de Axies (`Pomodoro`, `Kotaro`, `Bing`, `Tripp`) y enemigos `Sapidae` del catálogo oficial del Vibeathon (`jaatster/axie-3d-assets`), bajo la licencia de Sky Mavis Pte. Ltd.
* **Uso de Asistentes de IA:** Desarrollado con asistencia de programación en IA (Antigravity / Claude Code) para la arquitectura de waypoints, targeting de torres y shaders.
* **Sin Dependencias Propietarias:** Sin runtime de Spine 2D; 100% código abierto y compatible con la web moderna.

---

## 🚀 Cómo Ejecutar en Local

```bash
npm install
npm run dev
```
Abre en tu navegador: `http://127.0.0.1:3000`
