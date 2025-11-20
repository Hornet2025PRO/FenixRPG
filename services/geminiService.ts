
import { GoogleGenAI, Type } from "@google/genai";
import type { Character, GameUpdate, HistoryEntry, Scene, PlayerInput, InitialGameData, LocationType } from '../types';
import { CombatTactic } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const statusEffectSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "Nombre del efecto (ej. 'Envenenado', 'Aturdido')." },
        description: { type: Type.STRING, description: "Breve descripción de lo que hace el efecto." },
        duration: { type: Type.INTEGER, description: "Cuántos turnos más durará el efecto." },
        type: { type: Type.STRING, enum: ['BUFF', 'DEBUFF'], description: "Si el efecto es beneficioso (BUFF) o perjudicial (DEBUFF)." }
    },
    required: ['name', 'description', 'duration', 'type']
};

const inventoryItemSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "El nombre del objeto." },
        description: { type: Type.STRING, description: "Una descripción corta y evocadora del objeto." },
        emoji: { type: Type.STRING, description: "Un único emoji que represente visualmente el objeto (ej. 🗡️, 🧪, 🛡️)." }
    },
    required: ['name', 'description', 'emoji']
};

const characterSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        characterClass: { type: Type.STRING, enum: [
            'Guerrero', 'Mago', 'Pícaro', 'Caballero', 'Asesino', 'Trampero',
            'Artimago', 'Berserker', 'Brujo', 'Ladrón', 'Sanador', 'Tanque',
            'Ladrón de Habilidades', 'Cambiaformas', 'Nigromante'
        ] },
        race: { type: Type.STRING, enum: [
            'Humano', 'Elfo', 'Enano', 'Orco', 'Mediano', 
            'Dracónido', 'Tiefling', 'Celestial', 'Autómata', 'Bestia'
        ]},
        backstory: { type: Type.STRING },
        level: { type: Type.INTEGER, description: "Nivel actual del personaje." },
        currentXp: { type: Type.INTEGER, description: "Experiencia actual acumulada." },
        nextLevelXp: { type: Type.INTEGER, description: "Experiencia necesaria para alcanzar el siguiente nivel." },
        stats: {
            type: Type.OBJECT,
            properties: {
                hp: { type: Type.INTEGER },
                maxHp: { type: Type.INTEGER },
                mana: { type: Type.INTEGER },
                maxMana: { type: Type.INTEGER },
                strength: { type: Type.INTEGER },
                dexterity: { type: Type.INTEGER },
                intelligence: { type: Type.INTEGER },
                charisma: { type: Type.INTEGER },
            },
            required: ['hp', 'maxHp', 'mana', 'maxMana', 'strength', 'dexterity', 'intelligence', 'charisma']
        },
        inventory: {
            type: Type.ARRAY,
            items: inventoryItemSchema,
            description: "El inventario del personaje con detalles visuales (emoji)."
        },
        statusEffects: {
            type: Type.ARRAY,
            items: statusEffectSchema,
            description: "Una lista de los efectos de estado que afectan actualmente al personaje."
        },
        skills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Habilidades únicas que el personaje ha desbloqueado."
        },
        tactic: {
            type: Type.STRING,
            enum: ['Equilibrado', 'Agresivo (Atacar débil)', 'Defensivo (Priorizar vida)', 'Apoyo (Curar/Buff)', 'Cauto (Distancia)', 'Foco (Atacar al más fuerte)'],
            description: "La táctica de combate actual del personaje."
        }
    },
    required: ['name', 'characterClass', 'race', 'backstory', 'level', 'currentXp', 'nextLevelXp', 'stats', 'inventory', 'statusEffects', 'skills']
};

const partySchema = {
    type: Type.ARRAY,
    items: characterSchema
}

const enemyAttackSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "Nombre del ataque (ej. 'Aliento de Fuego', 'Golpe Brutal')." },
        description: { type: Type.STRING, description: "Breve descripción visual." },
        damageType: { type: Type.STRING, description: "Tipo de daño (Físico, Mágico, Fuego, Hielo, Ácido, etc.)." }
    },
    required: ['name', 'description', 'damageType']
};

const enemySchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING, description: "Una breve descripción del enemigo." },
        hp: { type: Type.INTEGER },
        maxHp: { type: Type.INTEGER },
        mana: { type: Type.INTEGER, nullable: true },
        maxMana: { type: Type.INTEGER, nullable: true },
        statusEffects: {
            type: Type.ARRAY,
            items: statusEffectSchema,
            description: "Una lista de los efectos de estado que afectan actualmente al enemigo."
        },
        resistances: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Tipos de daño a los que el enemigo es resistente (recibe menos daño). Ej: ['Fuego', 'Corte']."
        },
        weaknesses: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Tipos de daño a los que el enemigo es vulnerable (recibe más daño). Ej: ['Hielo', 'Sagrado']."
        },
        attacks: {
            type: Type.ARRAY,
            items: enemyAttackSchema,
            description: "Lista de 1 a 3 movimientos especiales o ataques característicos de este enemigo."
        }
    },
    required: ['name', 'description', 'hp', 'maxHp', 'statusEffects', 'resistances', 'weaknesses', 'attacks'],
};

const locationDetailsSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "Nombre del lugar actual." },
        type: { 
            type: Type.STRING, 
            enum: ['PUEBLO', 'BOSQUE', 'CUEVA', 'RUINAS', 'LLANURA', 'MONTANA', 'CRIPTA', 'MAZMORRA', 'GENERICO'],
            description: "El tipo de terreno o lugar."
        }
    },
    required: ['name', 'type']
};

const sceneSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['NARRATIVE', 'COMBAT'], description: "El tipo de escena actual."},
        description: { type: Type.STRING, description: "Una descripción detallada y atractiva de la situación actual, el entorno o el estado del combate. DEBE indicar claramente de quién es el turno ahora." },
        choices: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Un array de exactamente tres opciones distintas y accionables para que el jugador cuyo turno es elija a continuación."
        },
        enemies: {
            type: Type.ARRAY,
            items: enemySchema,
            nullable: true,
            description: "Una lista de enemigos en la escena, solo presente si el tipo de escena es 'COMBAT'."
        },
        timeOfDay: { type: Type.STRING, enum: ['DAY', 'NIGHT'], description: "El momento actual del día." },
        weather: { type: Type.STRING, enum: ['CLEAR', 'RAIN', 'STORM', 'SNOW'], description: "Las condiciones climáticas actuales." },
        locationDetails: {
            ...locationDetailsSchema,
            description: "Detalles de la ubicación actual."
        }
    },
    required: ['type', 'description', 'choices', 'timeOfDay', 'weather', 'locationDetails']
};

const gameUpdateSchema = {
    type: Type.OBJECT,
    properties: {
        scene: sceneSchema,
        updatedParty: partySchema,
        nextTurnIndex: {
            type: Type.INTEGER,
            description: "El índice del personaje en el array del grupo cuyo turno es el siguiente. Si el grupo tiene N jugadores, este número debe estar entre 0 y N-1."
        }
    },
    required: ['scene', 'updatedParty', 'nextTurnIndex']
};

const initialGameDataSchema = {
    type: Type.OBJECT,
    properties: {
        party: partySchema,
        scene: sceneSchema,
    },
    required: ['party', 'scene']
};

export const createAdventure = async (players: PlayerInput[]): Promise<InitialGameData> => {
    const prompt = `Eres un Dungeon Master para un juego de rol de fantasía. Vas a crear un grupo de personajes y la escena de apertura de su aventura.

**1. Crear el Grupo:**
La información de los jugadores es: ${JSON.stringify(players)}.
Para cada jugador, genera una historia de fondo atractiva y única (2-3 frases) que combine su CLASE y su RAZA.
**Estadísticas:** Genera estadísticas iniciales (PV entre 10-20, otras entre 5-15).
**Nivel:** Todos comienzan en Nivel 1, con 0 XP actual, y 100 XP necesarios para el siguiente nivel.
**Importante - Influencia de la Raza:**
- Orcos/Dracónidos: +Fuerza.
- Elfos/Medianos: +Destreza.
- Mago/Tiefling: +Inteligencia.
- Enanos: +Constitución (PV más alto).
- Humanos: Equilibrados.
**Importante - Influencia de la Clase:**
- Clases mágicas (Mago, Brujo) tienen MP alto (15-25).
- Clases físicas (Guerrero, Pícaro) tienen 0 MP o muy bajo.

Asigna un objeto inicial (con emoji) y UNA habilidad inicial.
Asigna la táctica 'Equilibrado' a todos por defecto.

**2. Crear la Escena Inicial:**
- \`scene.type\`: 'NARRATIVE'.
- \`scene.description\`: Escribe una introducción atractiva. Describe dónde se encuentra el grupo y qué está sucediendo. Dale un nombre al lugar (ej. 'Claro del Bosque Olvidado'). Termina indicando que es el turno del primer jugador.
- \`scene.choices\`: Tres opciones claras para el primer jugador.
- \`scene.timeOfDay\`: 'DAY'.
- \`scene.weather\`: 'CLEAR'.
- \`scene.locationDetails\`: Establece un tipo de ubicación apropiado.

Responde en un formato JSON válido que contenga 'party' y 'scene', siguiendo el esquema proporcionado.`;

    const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: initialGameDataSchema
        }
    });
    
    const jsonString = response.text.trim();
    const parsed = JSON.parse(jsonString);

    if (!parsed.party || !parsed.scene || parsed.party.length !== players.length) {
        throw new Error("La IA devolvió datos de aventura iniciales no válidos.");
    }
    
    return parsed as InitialGameData;
};


export const getGameUpdate = async (party: Character[], turnIndex: number, choice: string, history: HistoryEntry[], currentScene: Scene): Promise<GameUpdate> => {
    const partyJSON = JSON.stringify(party, null, 2);
    const actingCharacter = party[turnIndex];

    const recentHistory = history.slice(-5);
    const historyContext = recentHistory.length > 0
        ? recentHistory.map(entry =>
            `- Se vio: "${entry.sceneDescription.substring(0, 100)}..." y se eligió: "${entry.playerChoice}"`
          ).join('\n')
        : "Esta es la primera acción del grupo en la aventura.";

    const sceneContext = `**Situación Actual:**\n${JSON.stringify(currentScene, null, 2)}`;

    const prompt = `Eres un Dungeon Master experto.

**Contexto:**
${partyJSON}
Turno de: ${actingCharacter.name} (${actingCharacter.race} ${actingCharacter.characterClass}).
${sceneContext}
**Historial:**
${historyContext}
**Acción:**
"${choice}"

**Instrucciones de Tácticas:**
Cada personaje tiene una propiedad 'tactic'. Los aliados (no el personaje activo) deben actuar según esta táctica (ej. Sanador cura, Berserker ataca).

**Instrucciones de Enemigos:**
Si se generan enemigos, define:
- Resistencias/Debilidades lógicas.
- Ataques únicos con tipo de daño.

**REGLAS DE VIDA Y MUERTE (IMPORTANTE):**
1. **JUGADOR ÚNICO:** Si el grupo es de 1 persona y su HP llega a 0, **HA MUERTO DEFINITIVAMENTE**. Narra su final trágico y sangriento.
2. **MULTIJUGADOR:** 
   - Si un personaje tiene 0 HP, está **ABATIDO**. No puede actuar.
   - **REVIVIR:** Si un compañero tiene un objeto de resurrección (ej. "Cristal de Vida", "Fénix", "Poción de Lázaro"), **PERMITE** que lo use en sus opciones para revivir al caído.
   - **OBJETOS:** Ocasionalmente, otorga objetos de resurrección como botín raro en combates difíciles si hay un grupo.

**PROGRESIÓN Y EXPERIENCIA (XP):**
1. **Otorga XP:** Otorga XP al grupo si vencen enemigos, completan misiones o realizan acciones inteligentes.
2. **SUBIDA DE NIVEL:** Verifica si \`currentXp >= nextLevelXp\`. 
   - Si es VERDADERO: Incrementa \`level\` en 1. Mantén el XP sobrante. Aumenta \`nextLevelXp\`.
   - **AUMENTA ESTADÍSTICAS:** Al subir de nivel, DEBES aumentar MaxHP, MaxMP y las estadísticas principales.
   - **Narrativa:** Menciona explícitamente en la \`description\` si alguien sube de nivel.

**Tareas Generales:**
1.  **Procesa el Turno:** Resuelve la acción "${choice}". Ten en cuenta la Raza y Clase.
2.  **Mecánicas:** Gestiona día/noche, clima, habilidades y recompensas.
3.  **Inventario Visual:** Si encuentran objetos, incluye nombre y emoji.
4.  **Lugar:** Actualiza \`locationDetails\` si se mueven.
5.  **Combate:** Gestiona enemigos si los hay.
6.  **Salida:** Devuelve el \`updatedParty\`, la nueva \`scene\`, y el \`nextTurnIndex\`.`;

    const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: gameUpdateSchema,
        }
    });

    const jsonString = response.text.trim();
    const parsed = JSON.parse(jsonString);
    
    if (!parsed.updatedParty || parsed.updatedParty.length !== party.length) {
      console.warn("API returned invalid party data. Reverting to old party state.");
      parsed.updatedParty = party;
    }
    if (parsed.nextTurnIndex === undefined || parsed.nextTurnIndex >= party.length || parsed.nextTurnIndex < 0) {
        parsed.nextTurnIndex = (turnIndex + 1) % party.length;
    }
    
    // Ensure tactics, race, and level/xp persist (fallback for legacy or AI omissions)
    parsed.updatedParty = parsed.updatedParty.map((char: Character, i: number) => ({
        ...char,
        tactic: char.tactic || party[i].tactic || CombatTactic.BALANCED,
        race: char.race || party[i].race || 'Humano',
        level: char.level || party[i].level || 1,
        currentXp: (char.currentXp !== undefined) ? char.currentXp : (party[i].currentXp || 0),
        nextLevelXp: char.nextLevelXp || party[i].nextLevelXp || 100
    }));
    
    return parsed as GameUpdate;
};
