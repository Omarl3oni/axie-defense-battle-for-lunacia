# Walkthrough: Axie Defense (Battle for Lunacia) 🏰🛡️

Hemos implementado con éxito el videojuego **Axie Defense: Battle for Lunacia**, un Tower Defense 3D estratégico, visualmente espectacular y adictivo para el evento oficial **Sky Mavis Axie Vibeathon 2026**.

---

## 🎯 ¿Qué se ha construido?

### 1. Escenario 3D de Lunacia y Sistema de Waypoints
* **Camino Sinuoso en S:** Generado paramétricamente mediante curvas `CatmullRomCurve3` con adoquines de pizarra y bordillos de piedra.
* **Portal de Quimeras (Inicio):** Vórtice púrpura giratorio desde donde surgen las oleadas.
* **Árbol Ancestral de Lunacia (Fin):** Monumento sagrado con tronco ancestral, copa frondosa y corazón cristalino que el jugador debe defender con sus 20 vidas.
* **8 Plataformas Defensivas:** Pedestales de piedra con anillos rúnicos celestes que se iluminan de verde esmeralda al ocuparse.

### 2. Cuatro Roles Tácticos de Torres Axie
* 🍅 **Pomodoro (100 ⚡):** Fuego rápido continuo; al mejorar a Nivel 2 añade veneno con esporas.
* 🦊 **Kotaro (150 ⚡):** Cuchilladas de alto impacto con 35% de golpe crítico para destruir quimeras blindadas.
* 🌊 **Bing (175 ⚡):** Mortero de agua con daño en área (splash) y ralentización del 45%.
* 🪶 **Tripp (200 ⚡):** Francotirador de larguísimo alcance que elimina quimeras a la distancia.

### 3. Inspección, Mejoras de Torres y Habilidad Activa
* Haz clic sobre cualquier torre para ver su **rango 3D en el suelo**, sus estadísticas de combate y los botones para **Mejorar a Nivel 2 y 3** o **Vender por el 70% de reembolso**.
* ☄️ **Lluvia de Espinas:** Botón de poder activo (cooldown de 25s) para lanzar un meteorito sobre cualquier punto del camino.

### 4. Diez Oleadas Equilibradas y Control de Ritmo
* Monstruos veloces (*Scouts*), equilibrados (*Warriors*), acorazados pesados (*Armored*) y la temible **Reina Quimera Ancestral** en la Oleada 10.
* Barras de salud 3D en tiempo real sobre cada enemigo.
* Botón de velocidad **⏩ x1 / x2** y control manual para iniciar cada oleada con calma.

---

## 🕹️ Cómo Probar el Juego en Local

El servidor ya está activo:
👉 **[http://127.0.0.1:3000/](http://127.0.0.1:3000/)**

1. Pulsa **"¡DEFENDER LUNACIA!"**.
2. Empiezas con **300 SLP** y **20 Vidas**.
3. Selecciona una torre en el panel inferior (ej. **Pomodoro** o **Bing**) y haz clic en una de las plataformas de piedra cerca de una curva.
4. Pulsa **"⚔️ ¡INICIAR OLEADA!"** para desatar la primera horda.
5. Observa cómo tus Axies apuntan y disparan automáticamente proyectiles guiados.
6. ¡Mejora tus defensas y supera las 10 oleadas!
