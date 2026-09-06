# Axie Auto-Tactics: Lunacia Arena 🏆⚔️

**Axie Auto-Tactics: Lunacia Arena** es un videojuego de estrategia y drafting táctico (auto-battler) 3D para navegadores web desarrollado específicamente para el evento oficial **Sky Mavis Axie Vibeathon 2026**.

Inspirado en la profundidad estratégica de **Axie Core** y la adicción del bucle de drafting de títulos como *Super Auto Pets* y *Backpack Battles*, el jugador construye y gestiona un escuadrón de Axies, compra unidades en la tienda, activa sinergias de clases ancestrales de Lunacia, fusiona copias para forjar **Axies Nivel 2 Dorados** y lucha para alcanzar **10 Victorias** antes de perder sus **3 Vidas**.

---

## 🎮 Bucle de Juego y Mecánicas Clave

### 1. Fase de Tienda y Gestión (Estrategia Pura)
* **Economía:** Recibes 10 Monedas/Oro al inicio de cada ronda.
* **Reclutamiento:** Compra Axies con habilidades únicas por 3 monedas cada uno.
* **Fusión 3-en-1 (Nivel 2 Dorado ✨):** Si compras 3 copias de un mismo Axie, se fusionan automáticamente en una **versión dorada** con estadísticas multiplicadas (x1.85) y habilidades potenciadas.
* **Reroll (🎲 1 Oro):** Refresca el catálogo de la tienda buscando la pieza clave de tu composición.
* **Congelar (❄️ Gratis):** Bloquea las ofertas de la tienda para que permanezcan intactas en la siguiente ronda si necesitas ahorrar.
* **Posicionamiento Táctico:**
  * **Línea Delantera:** Tanques de alta resistencia (Planta / Reptil) para absorber los primeros impactos.
  * **Línea Media:** Unidades de daño continuo o soporte con estados alterados (Veneno, Aturdimiento).
  * **Línea Trasera:** Asesinos de alto impacto crítico o francotiradores que atacan a la retaguardia enemiga.

### 2. Sinergias de Clases Axie Core
* 🌱 **Sinergia Planta (2x Plantas):** Todos los aliados inician la batalla con **+30 de Escudo**.
* 🐾 **Sinergia Bestia (2x Bestias):** Todos los aliados obtienen **+25% de Probabilidad Crítica**.
* 💧 **Sinergia Aqua / Pájaro (2x Unidades):** **+25 de Velocidad de Ataque** (atacan antes en el orden de turno).

### 3. Fase de Combate (Resolución Cinematográfica)
* Pulsa **"¡AL COMBATE!"** para enfrentar tu escuadrón contra la horda enemiga de la ronda.
* Los Axies se atacan por orden estricto de velocidad, ejecutan animaciones 3D fluidas (`Attack`, `Skill`, `Hit`, `Death`) y calculan ventajas elementales.
* Gana **10 Victorias** para coronarte Campeón Supremo de Lunacia.

---

## 🛠️ Stack Tecnológico y Rendimiento (60 FPS Garantizados)

* **Rendimiento Ultraligero:** A diferencia de los juegos de hordas con cientos de entidades simultáneas, las batallas tácticas de escuadrones pequeños garantizan **60 FPS rocosos y cero lag** en cualquier portátil o teléfono móvil.
* **Motor 3D:** [Three.js](https://threejs.org/) con shaders PBR, iluminación dinámica, sombras y rigs esqueletales duplicados con `SkeletonUtils`.
* **Entorno y Bundler:** [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/).
* **Audio:** Web Audio API con sintetizador procedural de efectos sonoros y música chiptune retro (cero descargas pesadas ni problemas de CORS).

---

## ⚖️ Divulgación de Recursos, IA y Licencias (Regla 4 del Vibeathon)

* **Assets 3D Oficiales:** Modelos `.glb` de Axie Mascots (`Pomodoro`, `Kotaro`, `Bing`, `Tripp`, `Paladill`, `Xia`, `Kibo`) y enemigos `Sapidae` del catálogo oficial del Vibeathon (`jaatster/axie-3d-assets`), bajo la licencia de Sky Mavis Pte. Ltd.
* **Uso de Asistentes de IA:** Desarrollado con asistencia de programación en IA (Antigravity / Claude Code) para la arquitectura de simulación de combate, tipado TypeScript y shaders.
* **Sin Dependencias Propietarias:** Sin runtime de Spine 2D ni APIs no autorizadas; código modular y 100% web nativo.

---

## 🚀 Cómo Ejecutar el Proyecto en Local

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Abrir en el navegador:
   ```
   http://127.0.0.1:3000
   ```

Para compilar la versión de producción:
```bash
npm run build
```
La carpeta `/dist` está lista para ser desplegada en Vercel, Netlify o GitHub Pages con 1 clic.
