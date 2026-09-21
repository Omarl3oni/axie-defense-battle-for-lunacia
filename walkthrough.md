# 📜 Actualización y Mejora Integral de "Cómo Jugar" y Menús Interactivos — Walkthrough

Conforme a tu solicitud, hemos actualizado y modernizado tanto el **Manual Táctico ("Cómo Jugar")** como el **Tutorial Interactivo Guiado en Campo 3D**, explicando todas las mecánicas recientemente implementadas (estructuras de Homeland, roles, definitivas de Nivel 3, runas místicas, inspección y venta) y mejorando radicalmente la navegación y fluidez del menú interactivo.

---

## 🎯 Cambios Implementados

### 1. Manual Táctico Renovado con Pestañas Interactivas (`#guide-modal`)
El modal accesible desde el menú Hub ("Cómo Jugar") y desde el botón de ayuda del HUD en partida ahora cuenta con **4 pestañas temáticas interactivas**:

* **🏰 Fundamentos & Terreno:**
  - Explicación del objetivo sagrado (proteger el Árbol Ancestral de las quimeras del portal del Vacío).
  - Gestión de la energía mágica (**SLP**) para desplegar, mejorar e investigar.
  - Venta de torres y estructuras (recuperando el 70% del SLP invertido).
  - Oleadas progresivas y controles de cámara 3D (rotación con Clic Derecho / WASD, zoom con rueda, atajos rápidos).

* **🛖 Estructuras de Homeland (¡NUEVO!):**
  - **Cabaña de Cáñamo (+2 Población):** Explica que se inicia con cupo para solo 3 defensores (🏠 3/3 de población) y que es indispensable erigir cabañas para aumentar la capacidad y desplegar un ejército mayor.
  - **Herrería (Tecnología Nivel 2):** Explica que tus defensores requieren investigar su tecnología específica en una Herrería antes de poder evolucionar a Nivel 2.
  - **Herrería Nv.2 (Regla de 1 Permiso por Nivel 3):** Explica la mejora de la Herrería a Nivel 2 para forjar tecnologías de Élite y la **regla estricta de 1 permiso por torre**. Cada Herrería Nv.2 otorga un único permiso para subir 1 torre a Nv.3; para evolucionar otra torre idéntica, el jugador debe erigir una nueva Herrería.

* **🐾 Defensores & Habilidades Definitivas (Nivel 3):**
  - **Pomodoro (Planta):** Inoculación rápida de veneno continuo acumulativo; definitiva *Bomba de Esporas Cáusticas* con bombardeo triple en área.
  - **Kotaro (Bestia):** Daño crítico demoledor; definitiva *Doble Filo Vorpal* con tajo giratorio de 360°.
  - **Bing (Aqua):** Salpicaduras en área y ralentización; definitiva *Maremoto Torrencial* que empuja a los enemigos hacia atrás.
  - **Tripp (Pájaro):** Francotirador de largo alcance; definitiva *Calibre Divino Perforante* en línea recta.

* **🔮 Runas Místicas, Hechizos e Inspector:**
  - **Santuario Rúnico:** Selección de 1 de 3 bendiciones pasivas cada pocas oleadas clave (daño, velocidad, SLP extra, descuentos).
  - **Hechizo de Emergencia:** *Lluvia de Espinas* con tecla `[ESPACIO]` o botón HUD.
  - **Inspector Táctico:** Ajuste de prioridades de disparo (*Primero*, *Más Fuerte*, *Más Débil*, *Más Veloz*), mejoras y venta.

---

### 2. Tutorial Interactivo Paso a Paso en Campo 3D (`#tutorial-overlay`)
El tutorial guiado se ha ampliado y calibrado a **10 pasos interactivos** con foco lumínico animado:
1. **¡Bienvenida a Lunacia!** (Centro de la arena)
2. **⚡ Tu Energía Mágica: SLP** (Enfoca `.slp-pill`)
3. **❤️ Vidas y Oleadas Invasoras** (Enfoca `.lives-pill`)
4. **🏠 Límite de Población (Tropas)** (Enfoca `.pop-pill`)
5. **🛖 Cabaña de Cáñamo (+2 Tropas)** (Enfoca la tarjeta de la cabaña en el dock)
6. **🔬 Herrería & Forja Tecnológica** (Enfoca la tarjeta de la herrería en el dock, explicando el requisito de investigación y la regla de 1 permiso para Nv.3)
7. **🐾 Defensores y Ataques Definitivos** (Enfoca la fila de cartas de defensores)
8. **☄️ Hechizo: Lluvia de Espinas** (Enfoca el botón de hechizo flotante)
9. **🔮 Runas Místicas & Inspector** (Enfoca la barra de recursos y runas)
10. **🏆 ¡Listo para la Batalla!** (Enfoca `#start-wave-btn`)

---

### 3. Fluidez y Navegación del Menú Interactivo
* **Navegación por Teclado Completa:**
  - `[Flecha Derecha]` o `[Enter]`: Avanza al siguiente paso del tutorial o siguiente pestaña del manual.
  - `[Flecha Izquierda]`: Retrocede al paso o pestaña anterior.
  - `[Escape]`: Cierra o salta el tutorial y modales instantáneamente.
* **Puntos de Progreso Clicables (`.tutorial-dot`):**
  - Ahora cada punto del indicador inferior es interactivo; al pasar el cursor se ilumina y al hacer clic salta de inmediato a ese paso.
* **Transiciones y Estilos Visuales:**
  - Pestañas con microinteracciones y efectos luminosos neón.
  - Diseño responsivo adaptado a resoluciones de escritorio y móviles.
  - Soporte bilingüe integral en tiempo real (Español e Inglés).

---

## 🧪 Verificación Realizada
* **Compilación:** `npm run build` ejecutado exitosamente sin errores de TypeScript ni de empaquetado Vite.
