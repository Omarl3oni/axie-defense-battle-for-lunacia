export type Language = 'es' | 'en';

export interface TutorialStepLocalized {
  title: string;
  body: string;
  targetSelector: string | null;
  cardPlacement: 'center' | 'below' | 'above' | 'left';
  avatar: string;
}

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  es: {
    // Start / Welcome Screen
    gameBadge: 'AXIE VIBEATHON 2026 • SKY MAVIS',
    gameTitle: 'AXIE DEFENSE',
    gameSubtitle: 'Battle for Lunacia 🏰',
    welcomeSubtitle: 'Defensa Estratégica 3D en el Reino de Lunacia',
    gameDescription: '¡Las quimeras del abismo avanzan hacia el <strong>Árbol Ancestral</strong>! Despliega a tus Axies guardianes y salva Lunacia a lo largo de 10 intensas oleadas.',
    welcomePlayBtn: '⚔️ ¡ENTRAR A LA BATALLA!',
    startTutorialBtn: '🎓 CÓMO JUGAR (TUTORIAL)',
    startPlayBtn: '⚔️ JUGAR DIRECTAMENTE',
    welcomeCodexBtn: '📜 GUÍA DE AXIES & BESTIARIO',
    heroShowcaseTitle: 'GUARDIANES DE LUNACIA',
    creditsTag: 'Creado con cariño para el evento oficial Sky Mavis Axie Vibeathon 2026',
    selectLanguage: 'Idioma / Language:',
    menuReturnBtn: '🏠 Menú Principal',

    playNowBtn: '⚔️ JUGAR YA',
    playNowSub: 'Sin wallet • Sin registro • 100% Gratis',

    // Title Screen & Hub
    enterLunaciaBtn: '✨ ENTRAR A LUNACIA ✨',
    enterLunaciaSub: 'Toca la pantalla o presiona cualquier tecla para continuar',
    hubModeBadge: 'MODO DEFENDER LUNACIA',
    hubModeTitle: 'Defensa del Árbol Ancestral',
    hubModeDesc: 'Despliega a tus Axies en las defensas ancestrales, resiste las 20 oleadas de quimeras invasoras y defiende el Árbol Sagrado.',
    hubPlayBtn: '⚔️ INICIAR BATALLA',
    hubPlaySub: 'Dificultad Normal • 20 Oleadas • 100% Gratis',
    hubRosterTitle: 'Cuartel de Axies',
    hubRosterBadge: '🔒 PRÓXIMAMENTE (v1.1)',
    hubRosterDesc: 'En desarrollo para v1.1 • Ronin Wallet & NFTs',
    hubCodexTitle: 'Códex & Bestiario',
    hubCodexDesc: 'Torres y Quimeras invasoras',
    codexTitle: '📖 Códex & Bestiario de Lunacia',
    codexSubtitle: 'Compendio táctico de guardianes, edificaciones ancestrales y monstruos invasores.',
    codexTabDefenders: '🛡️ Defensores',
    codexTabStructures: '🛖 Estructuras',
    codexTabEnemies: '👾 Enemigos',
    codexCloseBtn: 'Volver al Menú ✕',
    hubTutorialTitle: 'Cómo Jugar',
    hubTutorialDesc: 'Aprende las mecánicas de juego',
    hubSettingsTitle: 'Configuración',
    hubSettingsDesc: 'Sonido, Idioma y Gráficos',
    backToCover: 'Volver a Portada',

    settingsBtnTitle: 'Ajustes y Configuración',
    settingsBadge: 'SISTEMA',
    settingsTitle: '⚙️ Configuración del Juego',
    settingsSubtitle: 'Ajusta el sonido, idioma y gráficos a tu gusto.',
    settingsAudioTitle: 'Sonido y Música',
    settingsMusicLabel: 'Música Ambiental:',
    settingsSfxLabel: 'Efectos de Sonido (SFX):',
    settingsLangTitle: 'Idioma / Language',
    settingsGraphicsTitle: 'Rendimiento y Calidad 3D',
    settingsQualityHigh: '✨ Máxima Calidad (Sombras y Efectos)',
    settingsQualityFast: '⚡ Modo Rendimiento (Mayor Fluidez)',
    settingsTransitionTitle: '🎬 Estilo de Transición de Portada',
    transitionCurtain: '🚪 Compuertas Rúnicas',
    transitionFadeBlack: '🌑 Fundido a Negro',
    testTransitionBtn: '▶️ Probar Transición Ahora',
    settingsSaveBtn: 'Guardar y Cerrar ✕',
    settingsCreditsTitle: 'Créditos del Proyecto',
    settingsCreditsBody: 'Desarrollado con cariño para el evento oficial Sky Mavis Axie Vibeathon 2026.',


    // Surrender Modal & Action
    surrenderBtn: 'Rendirse',
    surrenderTooltip: 'Rendirse y volver a la pantalla de inicio',
    surrenderBadge: 'CONFIRMACIÓN',
    surrenderTitle: '¿Rendirse?',
    surrenderMsg: '¿Estás seguro de que deseas abandonar la batalla y volver a la pantalla de inicio? Se perderá el progreso de esta partida.',
    surrenderConfirm: '🏳️ Sí, Rendirme',
    surrenderCancel: '⚔️ Continuar Jugando',

    // Top HUD
    wave: 'OLEADA',
    lives: 'Vidas',
    slp: 'SLP',
    tutorialHudBtn: '❓ Tutorial',
    rosterHudBtn: 'Cuartel (v1.1)',
    rosterBtnTitle: 'Cuartel de Defensores (En Construcción para v1.1)',
    musicBtnTitle: 'Música On/Off',
    startWaveReady: '⚔️ ¡INICIAR OLEADA!',
    startWaveIntermission: '⏳ OLEADA {wave} EN {sec}s • ⚡ INICIAR (+15⚡)',
    startWaveFighting: '⚔️ LUCHANDO • OLEADA {wave}',

    // Spell
    spellName: 'Lluvia de Espinas',
    spellTooltip: 'Lanza una lluvia de espinas destructiva en cualquier punto del camino',

    // Bottom Tray & Towers
    trayInstruction: '🌱 Elige un Axie y haz clic en el césped para colocarlo. Pulsa <strong>[ESC]</strong> o <strong>Clic Derecho</strong> para cancelar.',
    classPlant: 'Planta',
    classBeast: 'Bestia',
    classAqua: 'Aqua',
    classBird: 'Pájaro',
    pomodoroRole: 'Rápido & Veneno',
    kotaroRole: 'Crítico & Anti-Tanque',
    bingRole: 'Splash & Ralentiza',
    trippRole: 'Francotirador',

    // Tower Inspector
    inspectDmgLabel: 'Daño por Disparo:',
    inspectRangeLabel: 'Alcance de Visión:',
    inspectSpeedLabel: 'Velocidad de Ataque:',
    inspectPriorityLabel: '🎯 Prioridad de Disparo:',
    targetFirst: '🏁 Primero',
    targetFirstTitle: 'Dispara a la quimera más adelantada',
    targetStrongest: '💪 Fuerte',
    targetStrongestTitle: 'Prioriza al enemigo con más vida',
    targetWeakest: '🩸 Débil',
    targetWeakestTitle: 'Remata a los enemigos con menos vida',
    targetFastest: '⚡ Rápido',
    targetFastestTitle: 'Prioriza a los veloces en sprint',
    inspectLevel: 'Nivel {level}',
    inspectUnderConstruction: 'En Construcción... ({sec}s)',
    inspectBuildingBtn: 'CONSTRUYENDO...',
    inspectUpgrading: 'Mejorando a Nivel {level}...',
    inspectUpgradingBtn: 'MEJORANDO... ({sec}s)',
    inspectMaxLevel: 'MÁXIMO',
    btnUpgrade: 'Mejorar',
    btnSell: 'Vender',
    ultimateLvl3: '💥 Definitiva Nv.3:',

    // Tower Ultimate Descriptions
    ultPomodoro: 'Bombardeo Triple: cada 6 ataques dispara 3 proyectiles tóxicos en área.',
    ultKotaro: 'Tajo Giratorio: cada 5 ataques ejecuta un tajo circular en 360° en 3.5m.',
    ultBing: 'Ola Rompedora: cada 4 ataques crea un maremoto que empuja a los enemigos.',
    ultTripp: 'Disparo Divino: cada 5 ataques dispara un rayo perforante que atraviesa a todos los enemigos en fila.',
    ultCharging: 'Cargando ataque especial...',

    // Tower Traits & Descriptions
    pomodoroTrait: '🌿 Fuego Rápido & Esporas Venenosas',
    pomodoroDesc: 'Ametralladora de semillas rápidas. En Nivel 2 aplica veneno continuo.',
    kotaroTrait: '⚔️ Rompe-Blindajes & Crítico Masivo',
    kotaroDesc: 'Cuchilladas feroces con 35% de golpe crítico (x2.5 daño). Destruye quimeras blindadas.',
    bingTrait: '💧 Daño de Área & Ralentización',
    bingDesc: 'Dispara proyectiles de agua en mortero que explotan y ralentizan un 45% a los enemigos cercanos.',
    trippTrait: '🎯 Francotirador de Alta Precisión',
    trippDesc: 'Francotirador de larguísimo alcance. Elimina a las quimeras más adelantadas del camino.',

    // Roguelite Runes Modal
    runeBadge: 'BENDICIÓN ANCESTRAL',
    runeTitle: 'Runa Mística de Lunacia',
    runeSubtitle: 'Elige 1 bendición para potenciar tu estrategia 🌟',

    // Rune names and descriptions
    rune_storm_rune_name: 'Runa de Tormenta',
    rune_storm_rune_desc: 'Los críticos de Kotaro lanzan un rayo que salta a 3 quimeras cercanas infligiendo 70 de daño.',
    rune_frost_amulet_name: 'Amuleto de Glaciación',
    rune_frost_amulet_desc: 'Las explosiones de mortero de Bing congelan totalmente a los enemigos durante 1.0 segundo.',
    rune_hawkeye_rune_name: 'Ojo de Halcón',
    rune_hawkeye_rune_desc: 'Aumenta el alcance de visión de Tripp en un +35% y su daño base en un +25%.',
    rune_slp_harvest_name: 'Cosecha de SLP',
    rune_slp_harvest_desc: 'Cada quimera eliminada otorga +4 SLP adicionales al botín.',
    rune_celestial_fury_name: 'Furia Celestial',
    rune_celestial_fury_desc: 'El hechizo de Lluvia de Espinas reduce su tiempo de recarga a 13s y amplía su área +30%.',
    rune_deep_poison_name: 'Espinas Virulentas',
    rune_deep_poison_desc: 'El veneno de Pomodoro dura el doble (8s) y reduce la regeneración enemiga un 80%.',
    rune_ancient_bulwark_name: 'Baluarte de Lunacia',
    rune_ancient_bulwark_desc: 'Otorga inmediatamente +6 vidas extra y un escudo espiritual al Árbol Ancestral.',
    rune_swift_craft_name: 'Ingeniería Ágil',
    rune_swift_craft_desc: 'Todas las torres se construyen y evolucionan un 45% más rápido reduciendo el tiempo de espera.',

    // In-game Toasts
    toastSpellAim: '☄️ Haz clic en el sendero para lanzar la Lluvia de Espinas. [ESC] para cancelar.',
    toastTowerCooldown: '⏳ {name} aún está en enfriamiento ({sec}s).',
    toastInsufficientSLP: '⚠️ ¡SLP Insuficiente! Necesitas {cost} SLP para {name}.',
    toastBlockedSpot: '⚠️ No puedes colocar una torre aquí (terreno bloqueado o muy cerca del camino).',
    toastPopLimit: '⚠️ ¡Límite de población alcanzado ({cur}/{max})! Construye una Cabaña de Cáñamo (+2 Población).',
    toastCantSellHut: '⚠️ No puedes demoler esta cabaña porque sostiene a tus torres actuales.',

    // Homeland Buildings
    hempHutName: 'Cabaña Cáñamo',
    hummerHutName: 'Herrería',
    classHomeland: 'Edificio',
    hempHutRole: '+2 Población',
    hummerHutRole: '🔬 Tecnología',
    hempHutDesc: 'Cabaña de descanso. Alberga axies trabajadores y guardianes, aumentando la población.',
    hummerHutDesc: 'Herrería y forja. Investiga tecnologías para habilitar las mejoras de tus torres.',
    techLockNotice: '🔒 Requiere investigar tecnología en la Herrería',
    techLockNoticeLv3: '🔒 Requiere tecnología Nivel 3 forjada en una Herrería Nv.2 (1 por torre)',
    toastTechUnlocked: '🔬 ¡Tecnología completada: {name}! Ahora puedes mejorar tus torres {target} a Nivel {lvl}.',
    toastTechUnlockedLv3: '⭐ ¡Tecnología de Élite completada: {name}! Has obtenido 1 permiso para mejorar 1 torre {target} a Nivel 3.',
    toastTechAlreadyResearched: '✅ Esta tecnología ya ha sido desarrollada en esta herrería.',
    toastBuildingUpgraded: '✨ ¡{name} mejorada a Nivel {lvl}! Tecnologías de élite desbloqueadas.',

    // Tech names and descs - Nivel 2
    techPomodoro2Name: 'Esporas Tóxicas',
    techPomodoro2Desc: 'Desbloquea Pomodoro Nivel 2 (+veneno continuo y cadencia)',
    techKotaro2Name: 'Cuchillas Dentadas',
    techKotaro2Desc: 'Desbloquea Kotaro Nivel 2 (+35% crítico y daño masivo)',
    techBing2Name: 'Presión Hidráulica',
    techBing2Desc: 'Desbloquea Bing Nivel 2 (+radio de splash y ralentización)',
    techTripp2Name: 'Mira de Precisión',
    techTripp2Desc: 'Desbloquea Tripp Nivel 2 (+daño a distancia y sniper letal)',

    // Tech names and descs - Nivel 3 (Elite - 1 torre por investigación)
    techPomodoro3Name: 'Bomba de Esporas Cáusticas',
    techPomodoro3Desc: 'Permite 1 Pomodoro Nv.3: Desbloquea Bombardeo Triple en área',
    techKotaro3Name: 'Doble Filo Vorpal',
    techKotaro3Desc: 'Permite 1 Kotaro Nv.3: Desbloquea Tajo Giratorio 360°',
    techBing3Name: 'Maremoto Torrencial',
    techBing3Desc: 'Permite 1 Bing Nv.3: Desbloquea Ola Rompedora que empuja',
    techTripp3Name: 'Calibre Divino Perforante',
    techTripp3Desc: 'Permite 1 Tripp Nv.3: Desbloquea Rayo Divino que atraviesa filas',

    // Match Result Screen
    resultVictoryBadge: '¡VICTORIA ABSOLUTA!',
    resultVictoryTitle: '¡Lunacia Está a Salvo!',
    resultVictorySubtitle: 'Has defendido el Árbol Ancestral derrotando a las 10 oleadas de Quimeras.',
    resultDefeatBadge: 'DERROTA',
    resultDefeatTitle: 'El Árbol Ancestral ha Caído',
    resultDefeatSubtitle: 'Las quimeras lograron atravesar tus defensas en la Oleada {wave}.',
    resultClearedWaves: 'Oleadas superadas:',
    resultRemainingLives: 'Vidas restantes:',
    resultPlayAgain: 'JUGAR OTRA VEZ',

    // Tutorial Navigation
    tutStepLabel: 'Paso {current} de {total}',
    tutGuideName: 'Pomodoro el Guía',
    tutSkipBtn: 'Saltar ⏭️',
    tutPrevBtn: '⬅️ Anterior',
    tutNextBtn: 'Siguiente ➡️',
    tutFinishBtn: '⚔️ ¡A JUGAR!',

    // Guide / How to Play Modal
    guideBadge: 'MANUAL TÁCTICO DE LUNACIA',
    guideTitle: '📜 Guía Completa de Combate',
    guideSubtitle: 'Aprende las mecánicas clave, estructuras de Homeland, defensores y runas místicas.',
    guideTabBasics: '🏰 Fundamentos',
    guideTabBuildings: '🛖 Estructuras (Homeland)',
    guideTabDefenders: '🐾 Defensores & Definitivas',
    guideTabTactics: '🔮 Runas & Táctica',

    // Tab 1: Fundamentos
    guideBasics1Title: '1. Objetivo Sagrado',
    guideBasics1Desc: 'Las quimeras emergen del portal morado y avanzan por el sendero hacia el Árbol Ancestral. Evita a toda costa que lleguen o perderás vidas.',
    guideBasics1Tip: '💡 Puedes rotar la cámara con Clic Derecho / WASD y hacer zoom con la rueda.',
    guideBasics2Title: '2. Energía SLP & Recursos',
    guideBasics2Desc: 'Cada quimera aniquilada otorga SLP. Es la poción mágica indispensable para invocar torres, construir estructuras e investigar tecnologías.',
    guideBasics2Tip: '💡 Vende torres o edificios en desuso para recuperar el 70% del SLP invertido.',
    guideBasics3Title: '3. Oleadas y Supervivencia',
    guideBasics3Desc: 'Resiste todas las oleadas de dificultad creciente. Inicia las oleadas antes de que termine la cuenta regresiva para ganar bonificaciones de SLP.',
    guideBasics3Tip: '💡 Ajusta la velocidad del juego a x2 para acelerar el ritmo de batalla.',

    // Tab 2: Estructuras (Homeland)
    guideBuild1Title: '🛖 Cabaña de Cáñamo (+2 Población)',
    guideBuild1Desc: 'Empiezas la partida con espacio para solo 3 defensores (🏠 3/3 de población). ¡Construye cabañas sobre el césped para aumentar tu capacidad en +2 de población y poder desplegar más torres!',
    guideBuild1Tip: '💡 ¡Sin cabañas no podrás colocar más de 3 torres! Planifica su construcción temprano.',
    guideBuild2Title: '⚒️ Herrería (Tecnología Nivel 2)',
    guideBuild2Desc: 'Estructura tecnológica fundamental. Tus defensores no pueden subir a Nivel 2 hasta que investigues su tecnología específica en una Herrería.',
    guideBuild2Tip: '💡 Haz clic en la Herrería para abrir su panel de investigación científica.',
    guideBuild3Title: '⭐ Herrería Nv.2 (1 Permiso Nivel 3)',
    guideBuild3Desc: 'Mejora tu Herrería a Nivel 2 para forjar tecnologías de Élite. ¡Cada Herrería otorga ÚNICAMENTE 1 permiso por tecnología para subir 1 torre a Nivel 3! Construye nuevas Herrerías para obtener más permisos.',
    guideBuild3Tip: '💡 Regla estricta: 1 permiso por torre por Herrería Nivel 2.',

    // Tab 3: Defensores & Definitivas
    guideDef1Title: '🍅 Pomodoro (Planta)',
    guideDef1Desc: 'Cadencia rápida que inocula veneno acumulativo continuo. En Nivel 3 desata la Bomba de Esporas Cáusticas con bombardeo triple en área.',
    guideDef1Tip: '💡 Ideal cerca del inicio del sendero para envenenar a los enemigos desde el primer segundo.',
    guideDef2Title: '🦊 Kotaro (Bestia)',
    guideDef2Desc: 'Luchador cuerpo a cuerpo con altísimo daño crítico contra objetivos duros. En Nivel 3 desata el Doble Filo Vorpal con un tajo giratorio de 360°.',
    guideDef2Tip: '💡 Colócalo en curvas cerradas para golpear quimeras por ambos lados.',
    guideDef3Title: '🌊 Bing (Aqua)',
    guideDef3Desc: 'Dispara salpicaduras acuáticas en área que ralentizan a los enemigos. En Nivel 3 libera un Maremoto Torrencial que daña y empuja hacia atrás.',
    guideDef3Tip: '💡 Excelente combinación tras Pomodoro para ralentizar enemigos envenenados.',
    guideDef4Title: '🪶 Tripp (Pájaro)',
    guideDef4Desc: 'Francotirador de larguísimo alcance especializado en eliminar amenazas a distancia. En Nivel 3 dispara un Calibre Divino Perforante en línea recta.',
    guideDef4Tip: '💡 Sitúalo en posiciones centrales elevadas para cubrir múltiples tramos del mapa.',

    // Tab 4: Runas, Hechizos e Inspector
    guideTac1Title: '🔮 Runas Místicas Ancestrales',
    guideTac1Desc: 'Al completar ciertas oleadas clave, el santuario rúnico te otorgará 3 cartas de bendiciones mágicas permanentes (daño extra, velocidad, SLP o descuentos).',
    guideTac1Tip: '💡 Tus runas activas se muestran en la barra superior del HUD.',
    guideTac2Title: '☄️ Hechizo: Lluvia de Espinas',
    guideTac2Desc: 'Pulsa [ESPACIO] o el botón de hechizo flotante para desatar un bombardeo devastador en cualquier punto del camino cuando las defensas se vean superadas.',
    guideTac2Tip: '💡 Tiene tiempo de recarga; resérvalo para oleadas masivas o enemigos veloces.',
    guideTac3Title: '🎯 Inspector de Torres y Prioridad',
    guideTac3Desc: 'Haz clic en cualquier torre para consultar sus atributos, subir de nivel o ajustar su prioridad de disparo: Primero, Más Fuerte, Más Débil o Más Veloz.',
    guideTac3Tip: '💡 Configura a Tripp en "Fuerte" para priorizar tanques y a Pomodoro en "Primero".',

    guidePracticeBtn: '▶️ Practicar Tutorial Guiado en 3D',
    guideCloseBtn: '⚔️ ¡Listo! Volver a Batalla'
  },

  en: {
    // Start / Welcome Screen
    gameBadge: 'AXIE VIBEATHON 2026 • SKY MAVIS',
    gameTitle: 'AXIE DEFENSE',
    gameSubtitle: 'Battle for Lunacia 🏰',
    welcomeSubtitle: '3D Strategic Defense in the Realm of Lunacia',
    gameDescription: 'Abyssal chimeras are marching toward the <strong>Ancestral Tree</strong>! Deploy your guardian Axies and save Lunacia across 10 intense waves.',
    welcomePlayBtn: '⚔️ ENTER BATTLE!',
    startTutorialBtn: '🎓 HOW TO PLAY (TUTORIAL)',
    startPlayBtn: '⚔️ PLAY DIRECTLY',
    welcomeCodexBtn: '📜 AXIE GUIDE & BESTIARY',
    heroShowcaseTitle: 'GUARDIANS OF LUNACIA',
    creditsTag: 'Crafted with love for the official Sky Mavis Axie Vibeathon 2026',
    selectLanguage: 'Language / Idioma:',
    menuReturnBtn: '🏠 Main Menu',

    playNowBtn: '⚔️ PLAY NOW',
    playNowSub: 'No wallet • No account • 100% Free',

    // Title Screen & Hub
    enterLunaciaBtn: '✨ ENTER LUNACIA ✨',
    enterLunaciaSub: 'Tap screen or press any key to continue',
    hubModeBadge: 'LUNACIA DEFENSE MODE',
    hubModeTitle: 'Defend the Ancestral Tree',
    hubModeDesc: 'Deploy your Axie guardians onto ancestral towers, survive 20 waves of invading chimeras, and defend the Sacred Tree.',
    hubPlayBtn: '⚔️ START BATTLE',
    hubPlaySub: 'Normal Difficulty • 20 Waves • 100% Free',
    hubRosterTitle: 'Axie Barracks',
    hubRosterBadge: '🔒 COMING SOON (v1.1)',
    hubRosterDesc: 'In development for v1.1 • Ronin Wallet & NFTs',
    hubCodexTitle: 'Codex & Bestiary',
    hubCodexDesc: 'Towers & Invading Chimeras',
    codexTitle: '📖 Lunacia Codex & Bestiary',
    codexSubtitle: 'Tactical compendium of guardians, ancestral structures, and invading monsters.',
    codexTabDefenders: '🛡️ Defenders',
    codexTabStructures: '🛖 Structures',
    codexTabEnemies: '👾 Enemies',
    codexCloseBtn: 'Back to Menu ✕',
    hubTutorialTitle: 'How to Play',
    hubTutorialDesc: 'Learn the battle mechanics',
    hubSettingsTitle: 'Settings',
    hubSettingsDesc: 'Audio, Language & Graphics',
    backToCover: 'Back to Cover',

    settingsBtnTitle: 'Settings & Options',
    settingsBadge: 'SYSTEM',
    settingsTitle: '⚙️ Game Settings',
    settingsSubtitle: 'Customize audio, language, and display performance.',
    settingsAudioTitle: 'Audio & Music',
    settingsMusicLabel: 'Background Music:',
    settingsSfxLabel: 'Sound Effects (SFX):',
    settingsLangTitle: 'Language / Idioma',
    settingsGraphicsTitle: '3D Graphics & Performance',
    settingsQualityHigh: '✨ High Quality (Full shadows & effects)',
    settingsQualityFast: '⚡ Performance Mode (Smoother FPS)',
    settingsTransitionTitle: '🎬 Title Transition Style',
    transitionCurtain: '🚪 Rune Gates',
    transitionFadeBlack: '🌑 Fade to Black',
    testTransitionBtn: '▶️ Test Transition Now',
    settingsSaveBtn: 'Save & Close ✕',
    settingsCreditsTitle: 'Project Credits',
    settingsCreditsBody: 'Developed with passion for the official Sky Mavis Axie Vibeathon 2026.',


    // Surrender Modal & Action
    surrenderBtn: 'Surrender',
    surrenderTooltip: 'Surrender and return to the main menu',
    surrenderBadge: 'CONFIRMATION',
    surrenderTitle: 'Surrender Battle?',
    surrenderMsg: 'Are you sure you want to abandon the battle and return to the start screen? Current match progress will be lost.',
    surrenderConfirm: '🏳️ Yes, Surrender',
    surrenderCancel: '⚔️ Keep Fighting',

    // Top HUD
    wave: 'WAVE',
    lives: 'Lives',
    slp: 'SLP',
    tutorialHudBtn: '❓ Tutorial',
    rosterHudBtn: 'Barracks (v1.1)',
    rosterBtnTitle: 'Axie Barracks (Under Construction for v1.1)',
    musicBtnTitle: 'Music On/Off',
    startWaveReady: '⚔️ START WAVE!',
    startWaveIntermission: '⏳ WAVE {wave} IN {sec}s • ⚡ START (+15⚡)',
    startWaveFighting: '⚔️ IN COMBAT • WAVE {wave}',

    // Spell
    spellName: 'Thorn Rain',
    spellTooltip: 'Unleash a destructive thorn rain anywhere along the road',

    // Bottom Tray & Towers
    trayInstruction: '🌱 Pick an Axie and click on the grass to place it. Press <strong>[ESC]</strong> or <strong>Right Click</strong> to cancel.',
    classPlant: 'Plant',
    classBeast: 'Beast',
    classAqua: 'Aqua',
    classBird: 'Bird',
    pomodoroRole: 'Rapid & Poison',
    kotaroRole: 'Crit & Anti-Tank',
    bingRole: 'Splash & Slow',
    trippRole: 'Sniper',

    // Tower Inspector
    inspectDmgLabel: 'Damage per Shot:',
    inspectRangeLabel: 'Attack Range:',
    inspectSpeedLabel: 'Attack Speed:',
    inspectPriorityLabel: '🎯 Targeting Priority:',
    targetFirst: '🏁 First',
    targetFirstTitle: 'Target the chimera furthest ahead',
    targetStrongest: '💪 Strongest',
    targetStrongestTitle: 'Target enemy with highest HP',
    targetWeakest: '🩸 Weakest',
    targetWeakestTitle: 'Finish off enemies with lowest HP',
    targetFastest: '⚡ Fastest',
    targetFastestTitle: 'Target fast sprinting chimeras',
    inspectLevel: 'Level {level}',
    inspectUnderConstruction: 'Under Construction... ({sec}s)',
    inspectBuildingBtn: 'BUILDING...',
    inspectUpgrading: 'Upgrading to Level {level}...',
    inspectUpgradingBtn: 'UPGRADING... ({sec}s)',
    inspectMaxLevel: 'MAX LEVEL',
    btnUpgrade: 'Upgrade',
    btnSell: 'Sell',
    ultimateLvl3: '💥 Ultimate Lvl.3:',

    // Tower Ultimate Descriptions
    ultPomodoro: 'Triple Barrage: every 6 attacks fires 3 toxic AoE projectiles.',
    ultKotaro: 'Whirlwind Slash: every 5 attacks executes a 360° circular slash within 3.5m.',
    ultBing: 'Tidal Surge: every 4 attacks summons a tidal wave that knocks back enemies.',
    ultTripp: 'Divine Piercer: every 5 attacks fires a piercing beam hitting all enemies in line.',
    ultCharging: 'Charging special attack...',

    // Tower Traits & Descriptions
    pomodoroTrait: '🌿 Rapid Fire & Poison Spores',
    pomodoroDesc: 'Rapid seed machine gun. Applies continuous poison at Level 2.',
    kotaroTrait: '⚔️ Armor-Breaker & Massive Crit',
    kotaroDesc: 'Ferocious slashes with 35% crit chance (x2.5 dmg). Shreds armored chimeras.',
    bingTrait: '💧 Area Damage & Slow Effect',
    bingDesc: 'Fires water mortar shells that explode and slow nearby enemies by 45%.',
    trippTrait: '🎯 High-Precision Sniper',
    trippDesc: 'Ultra long-range sniper. Eliminates the furthest advancing chimeras.',

    // Roguelite Runes Modal
    runeBadge: 'ANCESTRAL BLESSING',
    runeTitle: 'Mystic Rune of Lunacia',
    runeSubtitle: 'Choose 1 blessing to empower your strategy 🌟',

    // Rune names and descriptions
    rune_storm_rune_name: 'Storm Rune',
    rune_storm_rune_desc: 'Kotaro crits unleash chain lightning to 3 nearby chimeras dealing 70 damage.',
    rune_frost_amulet_name: 'Frost Amulet',
    rune_frost_amulet_desc: 'Bing mortar explosions completely freeze enemies for 1.0 second.',
    rune_hawkeye_rune_name: 'Hawkeye Rune',
    rune_hawkeye_rune_desc: 'Increases Tripp attack range by +35% and base damage by +25%.',
    rune_slp_harvest_name: 'SLP Harvest',
    rune_slp_harvest_desc: 'Every defeated chimera grants +4 additional SLP reward.',
    rune_celestial_fury_name: 'Celestial Fury',
    rune_celestial_fury_desc: 'Thorn Rain spell cooldown reduced to 13s and expands AoE radius by +30%.',
    rune_deep_poison_name: 'Virulent Thorns',
    rune_deep_poison_desc: 'Pomodoro poison lasts twice as long (8s) and cuts enemy regen by 80%.',
    rune_ancient_bulwark_name: 'Lunacia Bulwark',
    rune_ancient_bulwark_desc: 'Immediately grants +6 extra lives and a spirit shield to the Ancestral Tree.',
    rune_swift_craft_name: 'Swift Craft',
    rune_swift_craft_desc: 'All towers construct and upgrade 45% faster reducing wait times.',

    // In-game Toasts
    toastSpellAim: '☄️ Click anywhere on the path to cast Thorn Rain. [ESC] to cancel.',
    toastTowerCooldown: '⏳ {name} is still on cooldown ({sec}s).',
    toastInsufficientSLP: '⚠️ Insufficient SLP! You need {cost} SLP for {name}.',
    toastBlockedSpot: '⚠️ Cannot place a tower here (blocked terrain or too close to the path).',
    toastPopLimit: '⚠️ Population limit reached ({cur}/{max})! Build a Hemp Hut (+2 Population).',
    toastCantSellHut: '⚠️ You cannot demolish this hut because it supports your active defenders.',

    // Homeland Buildings
    hempHutName: 'Hemp Hut',
    hummerHutName: 'Blacksmith',
    classHomeland: 'Building',
    hempHutRole: '+2 Population',
    hummerHutRole: '🔬 Technology',
    hempHutDesc: 'Resting hut. Houses worker and guardian axies to increase population.',
    hummerHutDesc: 'Blacksmith and forge. Research technologies to unlock tower upgrades.',
    techLockNotice: '🔒 Requires researching technology at the Blacksmith',
    techLockNoticeLv3: '🔒 Requires Level 3 tech researched at a Lv.2 Blacksmith (1 per tower)',
    toastTechUnlocked: '🔬 Technology complete: {name}! You can now upgrade your {target} towers to Level {lvl}.',
    toastTechUnlockedLv3: '⭐ Elite Technology complete: {name}! You earned 1 permit to upgrade 1 {target} tower to Level 3.',
    toastTechAlreadyResearched: '✅ This technology has already been researched at this blacksmith.',
    toastBuildingUpgraded: '✨ {name} upgraded to Level {lvl}! Elite technologies unlocked.',

    // Tech names and descs - Level 2
    techPomodoro2Name: 'Toxic Spores',
    techPomodoro2Desc: 'Unlocks Pomodoro Level 2 (+continuous poison and attack speed)',
    techKotaro2Name: 'Serrated Blades',
    techKotaro2Desc: 'Unlocks Kotaro Level 2 (+35% crit and armor break)',
    techBing2Name: 'Hydraulic Pressure',
    techBing2Desc: 'Unlocks Bing Level 2 (+splash radius and slow effect)',
    techTripp2Name: 'Precision Scope',
    techTripp2Desc: 'Unlocks Tripp Level 2 (+long-range damage and sniper pierce)',

    // Tech names and descs - Level 3 (Elite - 1 tower per research)
    techPomodoro3Name: 'Caustic Spore Bomb',
    techPomodoro3Desc: 'Allows 1 Pomodoro Lv.3: Unlocks Triple Bombardment AoE',
    techKotaro3Name: 'Vorpal Twin Blades',
    techKotaro3Desc: 'Allows 1 Kotaro Lv.3: Unlocks 360° Whirlwind Slash',
    techBing3Name: 'Torrential Tidal Wave',
    techBing3Desc: 'Allows 1 Bing Lv.3: Unlocks Tidal Wave knockback',
    techTripp3Name: 'Piercing Divine Caliber',
    techTripp3Desc: 'Allows 1 Tripp Lv.3: Unlocks Divine Beam through ranks',

    // Match Result Screen
    resultVictoryBadge: 'ABSOLUTE VICTORY!',
    resultVictoryTitle: 'Lunacia is Safe!',
    resultVictorySubtitle: 'You defended the Ancestral Tree by defeating all 10 Chimera waves.',
    resultDefeatBadge: 'DEFEAT',
    resultDefeatTitle: 'The Ancestral Tree has Fallen',
    resultDefeatSubtitle: 'The chimeras breached your defenses on Wave {wave}.',
    resultClearedWaves: 'Waves cleared:',
    resultRemainingLives: 'Lives remaining:',
    resultPlayAgain: 'PLAY AGAIN',

    // Tutorial Navigation
    tutStepLabel: 'Step {current} of {total}',
    tutGuideName: 'Pomodoro the Guide',
    tutSkipBtn: 'Skip ⏭️',
    tutPrevBtn: '⬅️ Back',
    tutNextBtn: 'Next ➡️',
    tutFinishBtn: '⚔️ PLAY NOW!',

    // Guide / How to Play Modal
    guideBadge: 'LUNACIA BATTLE MANUAL',
    guideTitle: '📜 Complete Combat Guide',
    guideSubtitle: 'Master core battle mechanics, Homeland structures, defenders, and mystic runes.',
    guideTabBasics: '🏰 Basics',
    guideTabBuildings: '🛖 Homeland Buildings',
    guideTabDefenders: '🐾 Defenders & Ultimates',
    guideTabTactics: '🔮 Runes & Tactics',

    // Tab 1: Basics
    guideBasics1Title: '1. Sacred Objective',
    guideBasics1Desc: 'Chimeras emerge from the purple void portal and march along the trail towards the Ancestral Tree. Stop them at all costs or you will lose sacred lives.',
    guideBasics1Tip: '💡 Rotate camera with Right Click / WASD and zoom using the mouse wheel.',
    guideBasics2Title: '2. SLP Energy & Resources',
    guideBasics2Desc: 'Every eliminated chimera awards SLP. This magical potion is essential to summon towers, erect structures, and research combat technologies.',
    guideBasics2Tip: '💡 Sell unused towers or structures to recover 70% of invested SLP.',
    guideBasics3Title: '3. Waves & Survival',
    guideBasics3Desc: 'Endure all waves of escalating difficulty. Start waves before the countdown ends to earn bonus SLP rewards.',
    guideBasics3Tip: '💡 Toggle game speed to x2 to accelerate the battle pace.',

    // Tab 2: Homeland Buildings
    guideBuild1Title: '🛖 Hemp Hut (+2 Population)',
    guideBuild1Desc: 'You begin the battle with capacity for only 3 defenders (🏠 3/3 population cap). Construct huts on the grass to grant +2 population cap and deploy more towers!',
    guideBuild1Tip: '💡 Without huts you cannot place more than 3 towers! Plan their construction early.',
    guideBuild2Title: '⚒️ Blacksmith (Level 2 Tech)',
    guideBuild2Desc: 'Crucial technological facility. Your defenders cannot be upgraded to Level 2 until you research their specific technology at a Blacksmith.',
    guideBuild2Tip: '💡 Click any Blacksmith on the field to open its scientific research console.',
    guideBuild3Title: '⭐ Blacksmith Lv.2 (1 Permit for Lv.3)',
    guideBuild3Desc: 'Upgrade your Blacksmith to Level 2 to forge Elite technologies. Each Blacksmith grants ONLY 1 permit per technology to elevate 1 tower to Level 3! Build more Blacksmiths to forge more permits.',
    guideBuild3Tip: '💡 Strict rule: 1 upgrade permit per tower per Level 2 Blacksmith.',

    // Tab 3: Defenders & Ultimates
    guideDef1Title: '🍅 Pomodoro (Plant)',
    guideDef1Desc: 'Rapid attack cadence inoculating progressive continuous poison. At Level 3 unleashes Caustic Spore Bomb with massive triple-burst area bombardment.',
    guideDef1Tip: '💡 Ideal near the start of the path to poison chimeras from their first steps.',
    guideDef2Title: '🦊 Kotaro (Beast)',
    guideDef2Desc: 'Melee fighter boasting catastrophic critical strike damage against tough targets. At Level 3 executes Vorpal Twin-Blade with a full 360° sweeping whirlwind.',
    guideDef2Tip: '💡 Place on hairpin bends to hit approaching and passing foes.',
    guideDef3Title: '🌊 Bing (Aqua)',
    guideDef3Desc: 'Fires splash water shells in an area that slow enemy movement. At Level 3 unleashes a Torrential Tidal Wave that deals damage and pushes chimeras back.',
    guideDef3Tip: '💡 Superb synergy right after Pomodoro to slow down poisoned groups.',
    guideDef4Title: '🪶 Tripp (Bird)',
    guideDef4Desc: 'Ultra-long range sniper specializing in eliminating high-priority targets. At Level 3 fires a Piercing Divine Caliber beam through entire rows of enemies.',
    guideDef4Tip: '💡 Position on central elevated ground to overlook multiple path bends.',

    // Tab 4: Runes, Spell & Inspector
    guideTac1Title: '🔮 Ancestral Mystic Runes',
    guideTac1Desc: 'Upon clearing key milestone waves, the runic shrine allows you to select 1 of 3 permanent passive blessings (bonus damage, attack speed, extra SLP, or discounts).',
    guideTac1Tip: '💡 Your active runes are displayed on the top HUD rune bar.',
    guideTac2Title: '☄️ Emergency Spell: Thorn Rain',
    guideTac2Desc: 'Press [SPACE] or tap the floating spell button to drop an intense meteor thorn strike anywhere on the path when defenses are overwhelmed.',
    guideTac2Tip: '💡 Possesses a cooldown timer; save it for heavy waves or emergency leaks.',
    guideTac3Title: '🎯 Tower Inspector & Priority',
    guideTac3Desc: 'Click any tower to inspect detailed stats, upgrade its level, or adjust targeting priority: First, Strongest, Weakest, or Fastest.',
    guideTac3Tip: '💡 Set Tripp to "Strongest" to focus tanks and Pomodoro to "First".',

    guidePracticeBtn: '▶️ Practice Guided 3D Tutorial',
    guideCloseBtn: '⚔️ Ready! Back to Battle'
  }
};

export const TUTORIAL_DATA: Record<Language, TutorialStepLocalized[]> = {
  es: [
    {
      title: '¡Bienvenida a Lunacia! 🏰',
      body: '¡El <strong>Árbol Ancestral</strong> está en peligro! Las quimeras invasoras saldrán por el portal morado y avanzarán por el sendero hacia el corazón sagrado.<br><br>¡Tu misión como Comandante es defenderlo colocando estratégicamente a tus <strong>defensores Axie</strong> y <strong>estructuras de Homeland</strong> en el césped!',
      targetSelector: null,
      cardPlacement: 'center',
      avatar: '🍅'
    },
    {
      title: '⚡ Tu Energía Mágica: SLP',
      body: 'Aquí arriba tienes tu <strong>SLP</strong> (Poción de Amor). Es el recurso mágico vital para <strong>invocar guardianes</strong>, construir estructuras e investigar tecnologías.<br><br>Empiezas con <strong>250 SLP</strong> y cosechas más con cada quimera eliminada en combate.',
      targetSelector: '.slp-pill',
      cardPlacement: 'below',
      avatar: '⚡'
    },
    {
      title: '❤️ Vidas y Oleadas Invasoras',
      body: 'Cuentas con <strong>10 vidas</strong>. Si una quimera logra llegar al Árbol Ancestral, perderás vidas sagradas.<br><br>Debes defenderte de las <strong>oleadas invasoras</strong> de dificultad progresiva. ¡Resiste todas para salvar Lunacia!',
      targetSelector: '.lives-pill',
      cardPlacement: 'below',
      avatar: '❤️'
    },
    {
      title: '🏠 Límite de Población (Tropas)',
      body: 'Aquí ves tu cupo de tropas. <strong>Empiezas con espacio para solo 3 defensores</strong> (🏠 3/3 de población).<br><br>⚠️ <em>¡Si alcanzas el cupo máximo, no podrás desplegar más torres hasta expandir tu población con Cabañas!</em>',
      targetSelector: '.pop-pill',
      cardPlacement: 'below',
      avatar: '🏠'
    },
    {
      title: '🛖 Cabaña de Cáñamo (+2 Tropas)',
      body: '¡Esta es la <strong>Cabaña de Cáñamo (Homeland)</strong>!<br><br>Construirla en el césped te otorga <strong>+2 de población máxima</strong> por solo 75 SLP.<br><br>💡 <em>Es la estructura esencial para poder invocar más de 3 torres y armar un ejército completo.</em>',
      targetSelector: '.tower-card[data-building="hemp_hut"]',
      cardPlacement: 'above',
      avatar: '🛖'
    },
    {
      title: '🔬 Herrería & Forja Tecnológica',
      body: '¡La <strong>Herrería</strong> es el centro tecnológico de tus tropas!<br><br>• <strong>Tecnologías Nivel 2</strong>: Investígalas aquí para desbloquear las mejoras a Nivel 2 de tus torres.<br>• <strong>Herrería Nv.2 & Nivel 3</strong>: Mejora tu Herrería a Nivel 2 para forjar tecnologías de Élite.<br>• ⭐ <strong>Regla de 1 Permiso</strong>: Cada Herrería Nv.2 otorga <strong>1 solo permiso</strong> por tecnología Nivel 3. ¡Construye otra Herrería para evolucionar otra torre a Nv.3!',
      targetSelector: '.tower-card[data-building="hummer_hut"]',
      cardPlacement: 'above',
      avatar: '⚒️'
    },
    {
      title: '🐾 Defensores y Ataques Definitivos',
      body: 'En la bandeja inferior eliges a tus defensores:<br>• 🍅 <strong>Pomodoro</strong>: Veneno corrosivo continuo.<br>• 🦊 <strong>Kotaro</strong>: Daño crítico devastador.<br>• 🌊 <strong>Bing</strong>: Salpicadura en área y ralentización.<br>• 🪶 <strong>Tripp</strong>: Francotirador de largo alcance.<br>✨ <em>¡Al llegar a Nivel 3, desbloquean <strong>ataques definitivos masivos</strong> automáticos!</em>',
      targetSelector: '.tower-cards-row',
      cardPlacement: 'above',
      avatar: '🐾'
    },
    {
      title: '☄️ Hechizo: Lluvia de Espinas',
      body: '¿Se te escapan demasiadas quimeras a la vez? Pulsa este botón o presiona <strong>[ESPACIO]</strong> y haz clic en el sendero para desatar un bombardeo devastador en área.<br><br><em>¡Posee enfriamiento, resérvalo para momentos cruciales!</em>',
      targetSelector: '.spell-container',
      cardPlacement: 'left',
      avatar: '☄️'
    },
    {
      title: '🔮 Runas Místicas & Inspector',
      body: '• 🔮 <strong>Runas Místicas</strong>: Cada pocas oleadas podrás escoger bendiciones pasivas que potencian tu velocidad, daño o SLP extra.<br>• 🎯 <strong>Inspector Táctico</strong>: Haz clic sobre cualquier torre para ver sus estadísticas, cambiar su <strong>prioridad de disparo</strong> (Primero, Fuerte, Débil, Rápido) o <strong>venderla</strong> por el 70% de SLP.',
      targetSelector: '.slp-pill',
      cardPlacement: 'below',
      avatar: '🔮'
    },
    {
      title: '🏆 ¡Listo para la Batalla!',
      body: '¡Ya conoces todas las mecánicas, estructuras de Homeland, defensores y runas de Lunacia!<br><br>Haz clic en <strong>⚔️ ¡INICIAR OLEADA!</strong> en cuanto estés preparado para recibir a la primera horda.<br><br><em>¡Que los espíritus de Lunacia guíen a tus guardianes!</em>',
      targetSelector: '#start-wave-btn',
      cardPlacement: 'below',
      avatar: '🏆'
    }
  ],

  en: [
    {
      title: 'Welcome to Lunacia! 🏰',
      body: 'The <strong>Ancestral Tree</strong> is under attack! Evil Chimeras emerge from the purple void portal to march down the trail toward the sacred heart.<br><br>Your mission as Commander is to defend it by strategically positioning <strong>Axie defenders</strong> and <strong>Homeland structures</strong> across the grass!',
      targetSelector: null,
      cardPlacement: 'center',
      avatar: '🍅'
    },
    {
      title: '⚡ SLP Energy & Resources',
      body: 'Here is your <strong>SLP</strong> (Smooth Love Potion). This vital magical resource is required to <strong>summon guardians</strong>, erect structures, and research combat tech.<br><br>You begin with <strong>250 SLP</strong> and harvest more by eliminating chimeras.',
      targetSelector: '.slp-pill',
      cardPlacement: 'below',
      avatar: '⚡'
    },
    {
      title: '❤️ Lives and Invading Waves',
      body: 'You have <strong>10 lives</strong>. If a chimera reaches the Ancestral Tree, you lose lives.<br><br>Defend against all <strong>waves</strong> of escalating difficulty. Defeating them all will save Lunacia and win the match!',
      targetSelector: '.lives-pill',
      cardPlacement: 'below',
      avatar: '❤️'
    },
    {
      title: '🏠 Population Cap (Troops)',
      body: 'Here is your troop limit counter. <strong>You begin with room for only 3 defenders</strong> (🏠 3/3 population cap).<br><br>⚠️ <em>Once capped, you cannot deploy additional towers until you expand your population capacity!</em>',
      targetSelector: '.pop-pill',
      cardPlacement: 'below',
      avatar: '🏠'
    },
    {
      title: '🛖 Hemp Hut (+2 Population)',
      body: 'This is the <strong>Hemp Hut (Homeland)</strong>!<br><br>Constructing it on the grass grants <strong>+2 population cap</strong> for just 75 SLP.<br><br>💡 <em>It is essential to build huts to recruit more than 3 towers and assemble a formidable defensive army.</em>',
      targetSelector: '.tower-card[data-building="hemp_hut"]',
      cardPlacement: 'above',
      avatar: '🛖'
    },
    {
      title: '🔬 Blacksmith & Tech Forging',
      body: 'The <strong>Blacksmith</strong> is the technological research hub of your forces!<br><br>• <strong>Level 2 Tech</strong>: Research here to unlock Level 2 upgrades for your defenders.<br>• <strong>Blacksmith Lv.2 & Level 3</strong>: Upgrade your Blacksmith to Level 2 to forge Elite Level 3 techs.<br>• ⭐ <strong>1-Permit Rule</strong>: Each Level 2 Blacksmith grants <strong>ONLY 1 permit</strong> per Level 3 tech. Build a new Blacksmith to upgrade another tower to Level 3!',
      targetSelector: '.tower-card[data-building="hummer_hut"]',
      cardPlacement: 'above',
      avatar: '⚒️'
    },
    {
      title: '🐾 Axie Defenders & Ultimates',
      body: 'Select your guardians from the bottom dock:<br>• 🍅 <strong>Pomodoro</strong>: Continuous corrosive poison.<br>• 🦊 <strong>Kotaro</strong>: Crushing critical strike damage.<br>• 🌊 <strong>Bing</strong>: Area splash and aquatic slow.<br>• 🪶 <strong>Tripp</strong>: Long-range sniper.<br>✨ <em>At Level 3, they unleash devastating automatic <strong>ultimate attacks</strong>!</em>',
      targetSelector: '.tower-cards-row',
      cardPlacement: 'above',
      avatar: '🐾'
    },
    {
      title: '☄️ Emergency Spell: Thorn Rain',
      body: 'Are chimeras breaking through your lines? Click this button or press <strong>[SPACE]</strong> and click on the path to call down a devastating area bombardment.<br><br><em>It has a cooldown, so save it for clutch moments!</em>',
      targetSelector: '.spell-container',
      cardPlacement: 'left',
      avatar: '☄️'
    },
    {
      title: '🔮 Mystic Runes & Inspector',
      body: '• 🔮 <strong>Mystic Runes</strong>: Every few waves, choose powerful permanent passive blessings to enhance damage, speed, or SLP gain.<br>• 🎯 <strong>Tower Inspector</strong>: Click any tower on the grass to view stats, change its <strong>targeting priority</strong> (First, Strongest, Weakest, Fastest), or <strong>sell it</strong> for a 70% SLP refund.',
      targetSelector: '.slp-pill',
      cardPlacement: 'below',
      avatar: '🔮'
    },
    {
      title: '🏆 Ready for Battle!',
      body: 'You are now equipped with knowledge of all mechanics, Homeland structures, defenders, and runes in Lunacia!<br><br>Click <strong>⚔️ START WAVE!</strong> whenever you are prepared to receive the first invading horde.<br><br><em>May the spirits of Lunacia guide your guardians!</em>',
      targetSelector: '#start-wave-btn',
      cardPlacement: 'below',
      avatar: '🏆'
    }
  ]
};

// Current Active Language Management
let currentLanguage: Language = 'es';

export function initLanguage(): Language {
  const saved = localStorage.getItem('axie_td_lang') as Language;
  if (saved && (saved === 'es' || saved === 'en')) {
    currentLanguage = saved;
  } else {
    // Detect browser language
    const navLang = navigator.language.toLowerCase();
    if (navLang.startsWith('en')) {
      currentLanguage = 'en';
    } else {
      currentLanguage = 'es';
    }
  }
  document.documentElement.lang = currentLanguage;
  return currentLanguage;
}

export function getCurrentLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
  localStorage.setItem('axie_td_lang', lang);
  document.documentElement.lang = lang;
  translateDOM();
}

export function t(key: string, params?: Record<string, string | number>): string {
  const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.es;
  let text = dict[key] || TRANSLATIONS.es[key] || key;

  if (params) {
    for (const [paramKey, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
    }
  }

  return text;
}

export function getTutorialSteps(lang?: Language): TutorialStepLocalized[] {
  const l = lang || currentLanguage;
  return TUTORIAL_DATA[l] || TUTORIAL_DATA.es;
}

export function translateDOM(): void {
  // Elements with data-i18n (replaces textContent)
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });

  // Elements with data-i18n-html (replaces innerHTML for formatted content)
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    if (key) {
      el.innerHTML = t(key);
    }
  });

  // Elements with data-i18n-title (replaces title attribute)
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (key) {
      el.setAttribute('title', t(key));
    }
  });

  // Highlight active language button in selector
  document.querySelectorAll('.btn-lang').forEach((btn) => {
    const btnLang = btn.getAttribute('data-lang');
    btn.classList.toggle('active', btnLang === currentLanguage);
  });
}
