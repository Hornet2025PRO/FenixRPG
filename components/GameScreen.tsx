
import React, { useRef, useEffect, useState } from 'react';
import type { Character, Scene, HistoryEntry, StatusEffect, Enemy } from '../types';
import { SceneType, CombatTactic } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { SunIcon, MoonIcon, RainIcon, StormIcon, SnowIcon, QuillIcon, TurnMarkerIcon, SkullIcon } from './icons';

// COMPONENT: TacticsModal
const TacticsModal: React.FC<{ party: Character[]; onUpdateTactic: (index: number, tactic: CombatTactic) => void; onClose: () => void }> = ({ party, onUpdateTactic, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="parchment p-6 rounded-lg shadow-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-display text-2xl font-bold text-stone-800">Estrategia de Combate</h3>
                    <button onClick={onClose} className="text-stone-500 hover:text-stone-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <p className="text-stone-600 text-sm mb-6 italic">
                    Define cómo actuarán tus compañeros cuando no sea su turno o cuando la IA narre sus acciones de apoyo.
                </p>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {party.map((char, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between bg-stone-800/5 p-3 rounded border border-stone-400/30">
                            <span className="font-bold text-stone-800 mb-2 sm:mb-0">{char.name}</span>
                            <select 
                                value={char.tactic || CombatTactic.BALANCED}
                                onChange={(e) => onUpdateTactic(index, e.target.value as CombatTactic)}
                                className="bg-[#fdfaf6] border border-stone-300 text-stone-700 text-sm rounded-md p-2 focus:ring-amber-500 focus:border-amber-500 block w-full sm:w-auto"
                            >
                                {Object.values(CombatTactic).map(tactic => (
                                    <option key={tactic} value={tactic}>{tactic}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
                <div className="mt-6 text-right">
                    <button onClick={onClose} className="bg-amber-800 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded shadow">
                        Hecho
                    </button>
                </div>
            </div>
        </div>
    );
};

// COMPONENT: StatusEffectBadge
const StatusEffectBadge: React.FC<{ effect: StatusEffect }> = ({ effect }) => {
  const color = effect.type === 'DEBUFF' ? 'bg-red-200 text-red-800 border-red-400' : 'bg-green-200 text-green-800 border-green-400';
  return (
    <div className={`text-xs font-semibold px-2 py-1 rounded-full border ${color} inline-block`} title={effect.description}>
      {effect.name} ({effect.duration})
    </div>
  );
};

// COMPONENT: CharacterSheet
const CharacterSheet: React.FC<{ character: Character }> = ({ character }) => {
  if (!character) return null;
  
  const isDead = character.stats.hp <= 0;

  const StatDisplay: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-2 border-b border-stone-400/30">
      <span className="font-bold text-stone-600">{label}</span>
      <span className="font-mono text-stone-800 text-lg">{value}</span>
    </div>
  );

  const ResourceBar: React.FC<{ value: number; maxValue: number; label: string; color: string; shortLabel: string }> = ({ value, maxValue, label, color, shortLabel }) => (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-bold text-stone-700">{label}</span>
        <span className="text-sm font-mono text-stone-600">{value} / {maxValue}</span>
      </div>
      <div className="w-full bg-stone-400/50 rounded-full h-4 border border-stone-500/50 shadow-inner">
        <div 
          className={`${color} h-full rounded-full transition-all duration-500 flex items-center justify-center text-xs font-bold text-white`} 
          style={{ width: `${Math.min((value / maxValue) * 100, 100)}%` }}
        >
          {Math.round((value / maxValue) * 100)}%
        </div>
      </div>
    </div>
  );

  const ExperienceBar: React.FC<{ current: number; next: number }> = ({ current, next }) => (
      <div className="mt-2">
          <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Experiencia</span>
              <span className="text-xs font-mono text-amber-900">{current} / {next} XP</span>
          </div>
          <div className="w-full bg-stone-800/20 rounded-full h-2">
              <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" 
                  style={{ width: `${Math.min((current / next) * 100, 100)}%` }}
              ></div>
          </div>
      </div>
  );

  return (
    <div className="parchment p-6 sm:p-8 rounded-lg relative overflow-hidden">
       {/* DEATH STAMP */}
       {isDead && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-4 border-red-900/50 text-red-900/50 font-display font-bold text-6xl -rotate-12 p-4 z-10 pointer-events-none whitespace-nowrap">
            ABATIDO
        </div>
      )}

      {/* Level Display Badge */}
      <div className="absolute top-0 right-0 p-4">
        <div className="flex flex-col items-center bg-amber-800 text-white rounded-b-lg px-3 py-2 shadow-md border-b-2 border-amber-900">
            <span className="text-xs uppercase font-bold tracking-widest opacity-80">Nivel</span>
            <span className="font-display text-2xl font-bold leading-none">{character.level}</span>
        </div>
      </div>

      <div className={`flex justify-between items-start mb-2 border-b-2 border-amber-800/20 pb-2 pr-20 ${isDead ? 'grayscale opacity-50' : ''}`}>
          <div>
            <h2 className="font-display text-4xl font-bold text-stone-800 text-shadow">{character.name}</h2>
            <p className="text-stone-600 font-semibold italic text-lg">{character.race} {character.characterClass}</p>
          </div>
      </div>
      
      <div className={`mb-6 ${isDead ? 'grayscale opacity-50' : ''}`}>
          <ExperienceBar current={character.currentXp} next={character.nextLevelXp} />
      </div>

      <div className={`flex justify-between mb-4 ${isDead ? 'grayscale opacity-50' : ''}`}>
           <div className="text-left">
              <span className="text-xs text-stone-500 uppercase tracking-wide block">Táctica</span>
              <div className="text-sm font-bold text-amber-800">{character.tactic || CombatTactic.BALANCED}</div>
          </div>
      </div>

      {character.statusEffects.length > 0 && (
          <div className="mb-6">
              <h3 className="font-display font-bold text-stone-800 mb-2 text-xl">Efectos Activos</h3>
              <div className="flex flex-wrap gap-2">
                  {character.statusEffects.map((effect, index) => <StatusEffectBadge key={index} effect={effect} />)}
              </div>
          </div>
      )}

      <div className={`mb-6 ${isDead ? 'opacity-70' : ''}`}>
        <h3 className="font-display font-bold text-stone-800 mb-3 text-xl">Estadísticas</h3>
        <div className="space-y-3">
          <ResourceBar value={character.stats.hp} maxValue={character.stats.maxHp} label="Puntos de Vida (PV)" color="bg-red-700" shortLabel="PV"/>
          {character.stats.maxMana > 0 && (
            <ResourceBar value={character.stats.mana} maxValue={character.stats.maxMana} label="Maná (MP)" color="bg-blue-600" shortLabel="MP"/>
          )}
          <div className={isDead ? 'opacity-50' : ''}>
            <StatDisplay label="Fuerza" value={character.stats.strength} />
            <StatDisplay label="Destreza" value={character.stats.dexterity} />
            <StatDisplay label="Inteligencia" value={character.stats.intelligence} />
            <StatDisplay label="Carisma" value={character.stats.charisma} />
          </div>
        </div>
      </div>
      
       <div className="mb-6">
        <h3 className="font-display font-bold text-stone-800 mb-2 text-xl">Habilidades</h3>
        {character.skills.length > 0 ? (
          <ul className="list-disc list-inside text-stone-700 space-y-1">
            {character.skills.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        ) : (
          <p className="text-stone-500 italic">Ninguna</p>
        )}
      </div>

       <div className="mb-6">
        <h3 className="font-display font-bold text-stone-800 mb-2 text-xl">Inventario</h3>
        {character.inventory.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {character.inventory.map((item, index) => {
                // Handle legacy saves where item might be a string
                if (typeof item === 'string') {
                    return (
                        <div key={index} className="bg-stone-800/5 border border-stone-400/30 rounded p-2 text-center text-xs font-bold text-stone-700">
                            {item}
                        </div>
                    );
                }
                return (
                    <div key={index} className="bg-stone-800/5 border border-stone-400/30 rounded p-2 text-center relative group cursor-help transition-all hover:bg-amber-800/10 hover:border-amber-800/40">
                       <div className="text-3xl mb-1 drop-shadow-sm">{item.emoji}</div>
                       <div className="text-xs font-bold text-stone-700 leading-tight">{item.name}</div>
                       {/* Tooltip */}
                       <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-stone-800 text-white text-xs p-3 rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity border border-amber-600/30">
                         <p className="font-bold text-amber-400 mb-1">{item.name}</p>
                         <p>{item.description}</p>
                       </div>
                    </div>
                );
            })}
          </div>
        ) : (
          <p className="text-stone-500 italic">Vacío</p>
        )}
      </div>

      <div>
        <h3 className="font-display font-bold text-stone-800 mb-2 text-xl">Trasfondo</h3>
        <p className="text-stone-700 italic leading-relaxed text-sm">{character.backstory}</p>
      </div>
    </div>
  );
};

// COMPONENT: PartyStatus
const PartyStatus: React.FC<{ party: Character[]; currentTurnIndex: number; damageAnimations: Record<string, boolean>; levelUpAnimations: Record<string, boolean> }> = ({ party, currentTurnIndex, damageAnimations, levelUpAnimations }) => {
  const StatBar: React.FC<{ value: number; maxValue: number; color: string }> = ({ value, maxValue, color }) => (
    <div className="w-full bg-stone-400/50 rounded-full h-1.5 shadow-inner">
      <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${(value / maxValue) * 100}%` }}></div>
    </div>
  );

  return (
    <div className="mb-6 border-b-2 border-dotted border-amber-900/50 pb-4">
      <div className="flex justify-between items-center mb-3">
         <h4 className="font-display text-lg font-bold text-stone-800">Estado del Grupo:</h4>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {party.map((character, index) => {
          const isDamaged = damageAnimations[`character-${character.name}`];
          const isLeveledUp = levelUpAnimations[`character-${character.name}`];
          const isDead = character.stats.hp <= 0;
          
          return (
            <div key={index} className={`relative p-3 rounded-md border-2 transition-all duration-300 ${isDead ? 'bg-stone-300 border-stone-400 grayscale opacity-75' : index === currentTurnIndex ? 'bg-amber-800/10 shadow-md animate-pulse-glow' : 'border-transparent bg-black/5'} ${isDamaged ? 'animate-damage' : ''} ${isLeveledUp ? 'ring-4 ring-yellow-400 ring-opacity-75' : ''}`}>
              
              {/* Level Up Animation Overlay */}
              {isLeveledUp && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20 animate-bounce whitespace-nowrap">
                      <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full border border-yellow-300 shadow-lg">
                          ¡NIVEL SUBIDO!
                      </span>
                  </div>
              )}

              <div className="flex items-center space-x-2 mb-1 relative">
                {isDead ? (
                    <span className="text-stone-700"><div className="w-5 h-5"><SkullIcon/></div></span>
                ) : (
                    character.statusEffects.length > 0 && (
                    <span title={character.statusEffects.map(e => e.name).join(', ')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.276-1.21 2.912 0l5.25 10.001c.636 1.21-.215 2.65-1.456 2.65H4.463c-1.24 0-2.092-1.44-1.456-2.65l5.25-10.001zM10 10a1 1 0 100-2 1 1 0 000 2zm0 4a1 1 0 110-2 1 1 0 010 2z" clipRule="evenodd" />
                        </svg>
                    </span>
                    )
                )}
                <div className="flex-grow min-w-0">
                    <p className={`font-bold text-sm truncate ${isDead ? 'text-stone-600 line-through' : index === currentTurnIndex ? 'text-amber-900' : 'text-stone-800'}`}>
                    {index === currentTurnIndex && !isDead && <span className="mr-1.5"><TurnMarkerIcon/></span>}
                    {character.name}
                    </p>
                    <p className="text-[10px] text-stone-500 font-semibold">{isDead ? 'ABATIDO' : `Nivel ${character.level}`}</p>
                </div>
              </div>
              <div className="space-y-1">
                <StatBar value={character.stats.hp} maxValue={character.stats.maxHp} color={isDead ? "bg-stone-500" : "bg-red-600"} />
                {character.stats.maxMana > 0 && (
                   <StatBar value={character.stats.mana} maxValue={character.stats.maxMana} color={isDead ? "bg-stone-400" : "bg-blue-600"} />
                )}
                {/* XP Mini Bar */}
                {!isDead && (
                    <div className="w-full bg-stone-800/10 rounded-full h-1">
                        <div className="bg-yellow-500 h-1 rounded-full" style={{ width: `${Math.min((character.currentXp / character.nextLevelXp) * 100, 100)}%` }}></div>
                    </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// COMPONENT: HistoryLog
const HistoryLog: React.FC<{ history: HistoryEntry[] }> = ({ history }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`parchment p-4 sm:p-6 rounded-lg mt-8 flex flex-col transition-all duration-300 ${isOpen ? 'h-96' : 'h-auto'}`}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full group focus:outline-none"
                aria-expanded={isOpen}
            >
                <h3 className="font-display font-bold text-stone-700 text-xl flex-shrink-0 group-hover:text-amber-800 transition-colors">
                    Diario de Viaje
                </h3>
                <span className={`text-stone-500 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </button>
            
            {isOpen ? (
                <div className="flex-grow overflow-y-auto pr-2 space-y-4 mt-4 border-t border-stone-400/30 pt-2 custom-scrollbar">
                    {[...history].reverse().map((entry, index) => (
                        <div key={index} className="pb-2 border-b border-dotted border-stone-400/50 last:border-b-0 text-sm">
                            <p className="text-stone-600 mb-1 italic">"{entry.sceneDescription.substring(0, 150)}..."</p>
                            <p className="font-bold text-amber-800/90 pl-2 flex items-center gap-2">
                                <span className="w-4 h-4 text-stone-500"><QuillIcon/></span> {entry.playerChoice}
                            </p>
                        </div>
                    ))}
                    {history.length === 0 && <p className="text-sm text-stone-500 italic">Vuestra historia comienza...</p>}
                </div>
            ) : (
                 history.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-stone-400/30 text-xs text-stone-500 italic truncate">
                        Último: {history[history.length - 1].playerChoice}
                    </div>
                )
            )}
        </div>
    );
};


// COMPONENT: EnemyDisplay
const EnemyDisplay: React.FC<{ enemy: Enemy; damageAnimations: Record<string, boolean>; index: number }> = ({ enemy, damageAnimations, index }) => {
    if (!enemy) return null;
    const StatBar: React.FC<{ value: number; maxValue: number; label: string; color: string }> = ({ value, maxValue, label, color }) => (
        <div className="mt-2">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-xs font-bold text-stone-700">{label}</span>
            <span className="text-xs font-mono text-stone-600">{value} / {maxValue}</span>
          </div>
          <div className="w-full bg-stone-400/50 rounded-full h-2 shadow-inner">
            <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${(value / maxValue) * 100}%` }}></div>
          </div>
        </div>
    );
    const isDamaged = damageAnimations[`enemy-${enemy.name}-${index}`];

    const ResistanceBadge: React.FC<{ name: string }> = ({ name }) => (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-800 border border-slate-300" title="Resistencia (Daño reducido)">
            🛡️ {name}
        </span>
    );

    const WeaknessBadge: React.FC<{ name: string }> = ({ name }) => (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300" title="Debilidad (Daño aumentado)">
            💔 {name}
        </span>
    );

    return (
      <div className={`border border-stone-400 p-3 rounded-md bg-stone-800/5 ${isDamaged ? 'animate-damage' : ''} flex flex-col h-full`}>
        <div className="mb-2">
            <p className="font-display font-bold text-stone-800 text-lg leading-none">{enemy.name}</p>
            <p className="text-xs text-stone-600 italic mt-1">{enemy.description}</p>
        </div>
        
        <div className="space-y-1 mb-3">
            <StatBar value={enemy.hp} maxValue={enemy.maxHp} label="PV" color="bg-yellow-600" />
            {enemy.maxMana && enemy.maxMana > 0 && (
              <StatBar value={enemy.mana ?? 0} maxValue={enemy.maxMana} label="MP" color="bg-blue-600" />
            )}
        </div>

        {/* Resistances & Weaknesses */}
        {(enemy.resistances?.length > 0 || enemy.weaknesses?.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-3">
                {enemy.resistances?.map((res, i) => <ResistanceBadge key={`res-${i}`} name={res} />)}
                {enemy.weaknesses?.map((weak, i) => <WeaknessBadge key={`weak-${i}`} name={weak} />)}
            </div>
        )}

        {/* Known Attacks */}
        {enemy.attacks && enemy.attacks.length > 0 && (
            <div className="mt-auto bg-stone-900/5 rounded p-2 border border-stone-300/50">
                <p className="text-xs font-bold text-stone-700 mb-1 uppercase tracking-wide border-b border-stone-300 pb-0.5">Habilidades:</p>
                <ul className="text-xs space-y-1">
                    {enemy.attacks.map((attack, i) => (
                        <li key={i} className="text-stone-800">
                            <span className="font-bold">• {attack.name}</span> <span className="text-stone-500">({attack.damageType})</span>
                        </li>
                    ))}
                </ul>
            </div>
        )}

        {enemy.statusEffects.length > 0 && (
            <div className="mt-3 border-t border-stone-400/50 pt-2 flex flex-wrap gap-1.5">
                {enemy.statusEffects.map((effect, index) => <StatusEffectBadge key={index} effect={effect} />)}
            </div>
        )}
      </div>
    );
};

// COMPONENT: WorldStateDisplay
const WorldStateDisplay: React.FC<{ timeOfDay: 'DAY' | 'NIGHT'; weather: 'CLEAR' | 'RAIN' | 'STORM' | 'SNOW'; onOpenTactics: () => void }> = ({ timeOfDay, weather, onOpenTactics }) => {
    const timeIcon = timeOfDay === 'DAY' ? <SunIcon /> : <MoonIcon />;
    const timeText = timeOfDay === 'DAY' ? 'Día' : 'Noche';

    let weatherIcon: React.ReactNode;
    let weatherText: string;
    switch (weather) {
        case 'RAIN':
            weatherIcon = <RainIcon />;
            weatherText = 'Lluvia';
            break;
        case 'STORM':
            weatherIcon = <StormIcon />;
            weatherText = 'Tormenta';
            break;
        case 'SNOW':
            weatherIcon = <SnowIcon />;
            weatherText = 'Nieve';
            break;
        default:
            weatherIcon = <></>;
            weatherText = 'Despejado';
            break;
    }

    return (
        <div className="absolute top-0 right-0 flex items-center justify-end gap-3 text-sm text-stone-600 bg-stone-800/5 px-3 py-1 rounded-bl-lg z-20">
            <button
                onClick={onOpenTactics}
                className="flex items-center gap-2 hover:text-amber-800 transition-colors cursor-pointer mr-2 font-bold border-r border-stone-400/30 pr-3"
                title="Estrategia de Combate"
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></svg>
               <span className="hidden sm:inline">Tácticas</span>
            </button>

            <div className="flex items-center gap-2" title={timeText}>
                <span className="w-5 h-5">{timeIcon}</span>
            </div>
            {weather !== 'CLEAR' && (
                <div className="flex items-center gap-2" title={weatherText}>
                    <span className="w-5 h-5">{weatherIcon}</span>
                </div>
            )}
        </div>
    );
};


// MAIN COMPONENT: GameScreen
interface GameScreenProps {
  party: Character[];
  currentTurnIndex: number;
  scene: Scene;
  history: HistoryEntry[];
  onChoice: (choice: string) => void;
  isLoading: boolean;
  isThrottled: boolean;
  onRestart: () => void;
  error: string | null;
  onClearError: () => void;
  onUpdateTactic: (index: number, tactic: CombatTactic) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ party, currentTurnIndex, scene, history, onChoice, isLoading, isThrottled, onRestart, error, onClearError, onUpdateTactic }) => {
  const isCombat = scene.type === SceneType.COMBAT && scene.enemies && scene.enemies.length > 0;
  const activeCharacter = party[currentTurnIndex];
  
  const [damageAnimations, setDamageAnimations] = useState<Record<string, boolean>>({});
  const [levelUpAnimations, setLevelUpAnimations] = useState<Record<string, boolean>>({});
  const [showTactics, setShowTactics] = useState(false);

  const prevPartyRef = useRef<Character[]>(party);
  const prevEnemiesRef = useRef<Enemy[]>(scene.enemies || []);

  useEffect(() => {
    if (isLoading) {
      prevPartyRef.current = party;
      prevEnemiesRef.current = scene.enemies || [];
      return;
    }

    const prevParty = prevPartyRef.current;
    const prevEnemies = prevEnemiesRef.current;
    const newDamageAnimations: Record<string, boolean> = {};
    const newLevelUpAnimations: Record<string, boolean> = {};

    party.forEach((char) => {
      const prevChar = prevParty.find(p => p.name === char.name);
      if (prevChar) {
          // Damage Check
          if (char.stats.hp < prevChar.stats.hp) {
              newDamageAnimations[`character-${char.name}`] = true;
          }
          // Level Up Check
          if (char.level > prevChar.level) {
              newLevelUpAnimations[`character-${char.name}`] = true;
          }
      }
    });

    scene.enemies?.forEach((enemy, index) => {
      if (prevEnemies[index] && enemy.hp < prevEnemies[index].hp) {
        newDamageAnimations[`enemy-${enemy.name}-${index}`] = true;
      }
    });

    if (Object.keys(newDamageAnimations).length > 0) {
      setDamageAnimations(prev => ({ ...prev, ...newDamageAnimations }));
      setTimeout(() => {
        setDamageAnimations(prev => {
          const newState = { ...prev };
          Object.keys(newDamageAnimations).forEach(key => delete newState[key]);
          return newState;
        });
      }, 600);
    }

    if (Object.keys(newLevelUpAnimations).length > 0) {
        setLevelUpAnimations(prev => ({ ...prev, ...newLevelUpAnimations }));
        // Longer duration for level up celebration
        setTimeout(() => {
          setLevelUpAnimations(prev => {
            const newState = { ...prev };
            Object.keys(newLevelUpAnimations).forEach(key => delete newState[key]);
            return newState;
          });
        }, 3000);
    }

    prevPartyRef.current = party;
    prevEnemiesRef.current = scene.enemies || [];
  }, [party, scene.enemies, isLoading]);


  return (
    <>
      {showTactics && (
          <TacticsModal 
              party={party}
              onUpdateTactic={onUpdateTactic}
              onClose={() => setShowTactics(false)}
          />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col">
          <CharacterSheet character={activeCharacter} />
          <HistoryLog history={history} />
        </div>

        <div className="lg:col-span-2 parchment rounded-lg p-8 sm:p-10 flex flex-col min-h-[500px]">
          <div className="flex-grow mb-6 relative">
            
            <PartyStatus party={party} currentTurnIndex={currentTurnIndex} damageAnimations={damageAnimations} levelUpAnimations={levelUpAnimations} />

            <WorldStateDisplay 
              timeOfDay={scene.timeOfDay} 
              weather={scene.weather}
              onOpenTactics={() => setShowTactics(true)}
            />

            <h3 className="font-display text-2xl font-bold text-stone-700 mb-1 text-shadow">
              {isCombat ? '⚔️ ¡En Combate! ⚔️' : 'Una Nueva Escena'}
            </h3>
            <p className="text-md font-semibold text-stone-700 mb-4">Turno de: <span className="text-amber-800 font-bold">{activeCharacter.name}</span></p>

            {isLoading && (
              <div className="absolute inset-0 bg-[#fdf9f3]/90 flex flex-col items-center justify-center rounded-md z-10">
                <LoadingSpinner />
                <p className="mt-4 text-stone-600 font-display text-lg">El destino se está escribiendo...</p>
              </div>
            )}

            {isCombat && (
              <div className="my-6 border-y-2 border-dotted border-amber-900/50 py-4">
                <h4 className="font-display text-lg font-bold text-stone-800 mb-3">Enemigos:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scene.enemies?.map((enemy, index) => (
                    <EnemyDisplay key={`${enemy.name}-${index}`} enemy={enemy} damageAnimations={damageAnimations} index={index} />
                  ))}
                </div>
              </div>
            )}

            <p className="text-stone-700 leading-relaxed whitespace-pre-wrap mt-4">{scene.description}</p>
          </div>

          <div>
            <h3 className="font-display text-2xl font-bold text-stone-700 mb-4 text-shadow">¿Qué haces?</h3>
            
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 relative rounded shadow-sm" role="alert">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold">¡Ha ocurrido un error!</p>
                            <p>{error}</p>
                        </div>
                        <button onClick={onClearError} className="text-red-700 hover:text-red-900 font-bold py-1 px-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {scene.choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => onChoice(choice)}
                  disabled={isLoading || isThrottled}
                  className="w-full text-left bg-[#fdfaf6] border border-stone-300 rounded-lg shadow-sm py-3 px-5 text-stone-800 transition-colors duration-150 hover:border-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600/70 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-dotted border-stone-400/50 text-center">
              <button
                  onClick={onRestart}
                  className="text-stone-500 hover:text-amber-800 text-sm font-bold transition-colors"
              >
                  Volver al Menú Principal
              </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GameScreen;
