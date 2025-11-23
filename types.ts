
export enum CharacterClass {
  GUERRERO = 'Guerrero',
  MAGO = 'Mago',
  PICARO = 'Pícaro',
  CABALLERO = 'Caballero',
  ASESINO = 'Asesino',
  TRAMPERO = 'Trampero',
  ARTIMAGO = 'Artimago',
  BERSERKER = 'Berserker',
  BRUJO = 'Brujo',
  LADRON = 'Ladrón',
  SANADOR = 'Sanador',
  TANQUE = 'Tanque',
  LADRON_DE_HABILIDADES = 'Ladrón de Habilidades',
  CAMBIAFORMAS = 'Cambiaformas',
  NIGROMANTE = 'Nigromante',
}

export enum CharacterRace {
    HUMANO = 'Humano',
    ELFO = 'Elfo',
    ENANO = 'Enano',
    ORCO = 'Orco',
    MEDIANO = 'Mediano',
    DRACONIDO = 'Dracónido',
    TIEFLING = 'Tiefling',
    CELESTIAL = 'Celestial',
    AUTOMATA = 'Autómata',
    BESTIA = 'Bestia',
}

export enum CombatTactic {
    BALANCED = 'Equilibrado',
    AGGRESSIVE = 'Agresivo (Atacar débil)',
    DEFENSIVE = 'Defensivo (Priorizar vida)',
    SUPPORT = 'Apoyo (Curar/Buff)',
    CAUTIOUS = 'Cauto (Distancia)',
    FOCUS = 'Foco (Atacar al más fuerte)'
}

export enum GameState {
    CHARACTER_CREATION = 'CHARACTER_CREATION',
    LOADING = 'LOADING',
    PLAYING = 'PLAYING',
    GAME_OVER = 'GAME_OVER',
}

export enum MultiplayerMode {
    OFFLINE = 'OFFLINE',
    HOST = 'HOST',
    GUEST = 'GUEST',
}

export enum SceneType {
  NARRATIVE = 'NARRATIVE',
  COMBAT = 'COMBAT',
}

export enum LocationType {
    PUEBLO = 'PUEBLO',
    BOSQUE = 'BOSQUE',
    CUEVA = 'CUEVA',
    RUINAS = 'RUINAS',
    LLANURA = 'LLANURA',
    MONTANA = 'MONTANA',
    CRIPTA = 'CRIPTA',
    MAZMORRA = 'MAZMORRA',
    GENERICO = 'GENERICO',
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    emoji: string;
    isHidden?: boolean; // If true, description is hidden until unlocked
}

export interface MapCoordinates {
    x: number;
    y: number;
}

export interface MapLocation {
    name: string;
    type: LocationType;
    coordinates: MapCoordinates;
    description?: string;
}

export interface StatusEffect {
  name: string;
  description: string;
  duration: number; // Turnos restantes
  type: 'BUFF' | 'DEBUFF';
}

export interface CharacterStats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  strength: number;
  dexterity: number;
  intelligence: number;
  charisma: number;
}

export interface InventoryItem {
  name: string;
  description: string;
  emoji: string;
}

export interface Character {
  name: string;
  characterClass: CharacterClass;
  race: CharacterRace;
  backstory: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  stats: CharacterStats;
  inventory: InventoryItem[];
  statusEffects: StatusEffect[];
  skills: string[];
  tactic?: CombatTactic;
  mapCoordinates?: MapCoordinates;
}

export interface EnemyAttack {
    name: string;
    description: string;
    damageType: string; // Físico, Fuego, Hielo, etc.
}

export interface Enemy {
  name: string;
  description: string;
  hp: number;
  maxHp: number;
  mana?: number;
  maxMana?: number;
  statusEffects: StatusEffect[];
  resistances: string[]; // Ej: ["Fuego", "Perforante"]
  weaknesses: string[]; // Ej: ["Sagrado", "Hielo"]
  attacks: EnemyAttack[];
  mapCoordinates?: MapCoordinates;
}

export interface LocationDetails {
    name: string;
    type: LocationType;
}

export interface Scene {
  type: SceneType;
  description: string;
  choices: string[];
  enemies?: Enemy[];
  timeOfDay: 'DAY' | 'NIGHT';
  weather: 'CLEAR' | 'RAIN' | 'STORM' | 'SNOW';
  locationDetails?: LocationDetails;
}

export interface GameUpdate {
  scene: Scene;
  updatedParty: Character[];
  nextTurnIndex: number;
  unlockedAchievements?: string[]; // IDs of achievements unlocked this turn
}

export interface InitialGameData {
  party: Character[];
  scene: Scene;
}

export interface HistoryEntry {
  sceneDescription: string;
  playerChoice: string;
}

export interface PlayerInput {
    name: string;
    characterClass: CharacterClass;
    race: CharacterRace;
}

export interface SaveSlot {
  id: number;
  name: string;
  savedAt: string;
  party: Character[];
  scene: Scene;
  history: HistoryEntry[];
  turnIndex: number;
}

export interface NetworkMessage {
    type: 'SYNC_STATE' | 'PLAYER_ACTION' | 'GAME_START';
    payload: any;
}
