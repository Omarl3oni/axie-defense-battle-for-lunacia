# Axie Survivors: Lunacia Outbreak 🛡️🌾

**Axie Survivors: Lunacia Outbreak** es un roguelike de supervivencia 3D para navegadores web desarrollado para el evento oficial **Sky Mavis Axie Vibeathon 2026**.

Inspirado en los valles de Lunacia y la esencia de **Axie Core**, el jugador toma el control de un Axie en un entorno hostil amenazado por hordas de quimeras y Sapidae descontrolados. Al sobrevivir, recoger orbes de energía y subir de nivel, el jugador puede mutar y mejorar las 6 partes corporales de su Axie en tiempo real para desatar ataques devastadores y derrotar al Jefe Quimera en el minuto 4:00.

---

## 🎮 Jugabilidad y Controles

* **Movimiento:** Teclas `W`, `A`, `S`, `D` o `Flechas del Teclado`.
* **Móvil / Pantalla Táctil:** Arrastra el dedo por la pantalla para moverte mediante el joystick virtual automático.
* **Auto-Ataque:** Tu Axie apunta y activa sus habilidades de forma autónoma. Tu habilidad radica en el posicionamiento, la esquiva y la sinergia de tu build.

---

## 🧬 Sinergia con Axie Core

Cada habilidad del juego representa fielmente una parte anatómica del universo Axie:

1. **Cuerno (*Pocky Spikes* - Clase Planta):** Proyectiles perforantes afilados que atraviesan filas de enemigos.
2. **Espalda (*Pumpkin Shield* - Clase Planta):** Escudos rotatorios que infligen daño continuo a cualquier monstruo que intente rodearte.
3. **Cola (*Carrot Rocket* - Clase Planta):** Cohetes de zanahoria explosivos que impactan en grupos distantes de quimeras.
4. **Boca (*Nutcracker Bite* - Clase Bestia):** Mordisco salvaje en cono frontal con alta probabilidad de golpe crítico.
5. **Mejoras Pasivas Lunacianas:**
   * *Vitalidad Lunaciana:* Aumento de vida máxima y curación instantánea.
   * *Pluma de Pájaro:* Bonificación de velocidad de movimiento.
   * *Furia de Bestia:* Aumento de daño base y multiplicador de crítico.
   * *Imán de Lunacia:* Incrementa el radio de atracción de gemas y orbes.

---

## 🛠️ Stack Tecnológico

* **Motor 3D:** [Three.js](https://threejs.org/) (WebGL / WebGPU nativo, 60 FPS garantizados).
* **Entorno y Bundler:** [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/).
* **Audio:** Web Audio API (Sintetizador procedural de efectos de sonido y ritmo de bajo 8-bit).
* **Físicas y Detección:** Algoritmo espacial 2.5D optimizado para más de 150 enemigos simultáneos sin caídas de framerate.

---

## ⚖️ Divulgación de Recursos, IA y Licencias (Regla 4 del Vibeathon)

* **Assets 3D Oficiales:** Modelos `.glb` animados de Axie Mascots (`Pomodoro`, `Kotaro`) y enemigos `Sapidae` obtenidos del repositorio oficial de recursos del Vibeathon (`jaatster/axie-3d-assets`), bajo la licencia de evento otorgada por Sky Mavis Pte. Ltd.
* **Uso de Asistentes de IA:** Código desarrollado en colaboración con el asistente de programación de IA Antigravity / Claude Code para la arquitectura, shaders, lógica de combate y sistemas de juego.
* **Licencias de Animación:** No se utiliza el runtime propietario de Spine 2D; todas las animaciones se ejecutan nativamente mediante esqueletos glTF y `THREE.AnimationMixer`.

---

## 🚀 Cómo Ejecutar el Proyecto en Local

1. Clona este repositorio:
   ```bash
   git clone <url-del-repo>
   cd "Proyecto Axie"
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
4. Abre tu navegador en `http://127.0.0.1:3000`.

Para compilar la versión optimizada para producción:
```bash
npm run build
```
La carpeta `/dist` resultante está lista para ser desplegada directamente en Vercel, Netlify o GitHub Pages con un solo clic.
