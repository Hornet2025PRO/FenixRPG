
import React, { useState, useEffect } from 'react';
import { CharacterClass, CharacterRace, PlayerInput, SaveSlot } from '../types';
import { 
  WarriorIcon, MageIcon, RogueIcon, KnightIcon, AssassinIcon, TrapperIcon, 
  ArtificerIcon, BerserkerIcon, WarlockIcon, ThiefIcon, HealerIcon, TankIcon, 
  SkillThiefIcon, ShapeshifterIcon, NecromancerIcon, EditIcon, TrashIcon,
  HumanIcon, ElfIcon, DwarfIcon, OrcIcon, HalflingIcon, DragonbornIcon, 
  TieflingIcon, CelestialIcon, AutomatonIcon, BeastkinIcon
} from './icons';
import LoadingSpinner from './LoadingSpinner';

interface CharacterCreationProps {
  onPartyCreate: (players: PlayerInput[]) => void;
  onHostGame: () => Promise<string>;
  onJoinGame: (hostId: string) => Promise<void>;
  error: string | null;
  savedGames: SaveSlot[];
  onLoadGame: (id: number) => void;
  onDeleteGame: (id: number) => void;
  onRenameGame: (id: number, newName: string) => void;
}

const MAX_PLAYERS = 5;

const classOptions = [
    { class: CharacterClass.GUERRERO, icon: <WarriorIcon />, description: "Maestro de armas, temible en combate cuerpo a cuerpo." },
    { class: CharacterClass.CABALLERO, icon: <KnightIcon />, description: "Un bastión de honor, protegiendo a los aliados con su escudo." },
    { class: CharacterClass.BERSERKER, icon: <BerserkerIcon />, description: "Un guerrero salvaje que canaliza la furia para ataques devastadores." },
    { class: CharacterClass.TANQUE, icon: <TankIcon />, description: "Una fortaleza inamovible, capaz de soportar los golpes más duros." },
    { class: CharacterClass.MAGO, icon: <MageIcon />, description: "Portador de energías arcanas, que moldea la realidad con hechizos." },
    { class: CharacterClass.BRUJO, icon: <WarlockIcon />, description: "Pacta con seres oscuros para obtener poder y lanzar maldiciones." },
    { class: CharacterClass.NIGROMANTE, icon: <NecromancerIcon />, description: "Maestro de la vida y la muerte, comanda legiones de no-muertos." },
    { class: CharacterClass.SANADOR, icon: <HealerIcon />, description: "Canaliza energía divina para curar heridas y proteger a los caídos." },
    { class: CharacterClass.ARTIMAGO, icon: <ArtificerIcon />, description: "Fusiona magia y tecnología para crear inventos y artilugios arcanos." },
    { class: CharacterClass.PICARO, icon: <RogueIcon />, description: "Una figura de sigilo y astucia, que ataca desde la oscuridad." },
    { class: CharacterClass.ASESINO, icon: <AssassinIcon />, description: "Un especialista en la muerte sigilosa, eliminando objetivos con precisión." },
    { class: CharacterClass.LADRON, icon: <ThiefIcon />, description: "Experto en el arte del robo, el sigilo y la infiltración." },
    { class: CharacterClass.TRAMPERO, icon: <TrapperIcon />, description: "Un maestro del terreno, que utiliza trampas y el entorno para vencer." },
    { class: CharacterClass.CAMBIAFORMAS, icon: <ShapeshifterIcon />, description: "Adopta la forma de bestias, combinando instinto animal y poder." },
    { class: CharacterClass.LADRON_DE_HABILIDADES, icon: <SkillThiefIcon />, description: "Roba y replica las habilidades de sus enemigos para usarlas a su favor." },
];

const raceOptions = [
    { race: CharacterRace.HUMANO, icon: <HumanIcon />, description: "Versátiles y ambiciosos, se adaptan a cualquier situación." },
    { race: CharacterRace.ELFO, icon: <ElfIcon />, description: "Ágiles y sabios, con una afinidad natural por la magia y la naturaleza." },
    { race: CharacterRace.ENANO, icon: <DwarfIcon />, description: "Robustos y resistentes, maestros de la piedra y el metal." },
    { race: CharacterRace.ORCO, icon: <OrcIcon />, description: "Fuertes y fieros, guerreros natos con una gran resistencia física." },
    { race: CharacterRace.MEDIANO, icon: <HalflingIcon />, description: "Pequeños y afortunados, expertos en pasar desapercibidos." },
    { race: CharacterRace.DRACONIDO, icon: <DragonbornIcon />, description: "Orgullosos descendientes de dragones, con aliento elemental." },
    { race: CharacterRace.TIEFLING, icon: <TieflingIcon />, description: "Portadores de una herencia infernal, carismáticos y astutos." },
    { race: CharacterRace.CELESTIAL, icon: <CelestialIcon />, description: "Tocados por la luz divina, irradian esperanza y poder sagrado." },
    { race: CharacterRace.AUTOMATA, icon: <AutomatonIcon />, description: "Seres artificiales construidos para la guerra o el servicio." },
    { race: CharacterRace.BESTIA, icon: <BeastkinIcon />, description: "Humanoides con rasgos animales y sentidos agudizados." },
];

const CharacterCreation: React.FC<CharacterCreationProps> = ({ onPartyCreate, onHostGame, onJoinGame, error, savedGames, onLoadGame, onDeleteGame, onRenameGame }) => {
  const [playerCount, setPlayerCount] = useState(1);
  const [players, setPlayers] = useState<PlayerInput[]>([{ name: '', characterClass: CharacterClass.GUERRERO, race: CharacterRace.HUMANO }]);
  const [isLoading, setIsLoading] = useState(false);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameText, setRenameText] = useState('');
  
  // Multiplayer States
  const [multiplayerView, setMultiplayerView] = useState<'NONE' | 'HOSTING' | 'JOINING'>('NONE');
  const [hostId, setHostId] = useState<string>('');
  const [joinIdInput, setJoinIdInput] = useState('');
  const [guestConnected, setGuestConnected] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const hasSavedGames = savedGames.length > 0;

  useEffect(() => {
    setPlayers(currentPlayers => {
      const newPlayers = [...currentPlayers];
      while (newPlayers.length < playerCount) {
        newPlayers.push({ name: '', characterClass: CharacterClass.GUERRERO, race: CharacterRace.HUMANO });
      }
      return newPlayers.slice(0, playerCount);
    });
  }, [playerCount]);

  const updatePlayer = (index: number, field: keyof PlayerInput, value: CharacterClass | CharacterRace | string) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    setPlayers(newPlayers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allNamesValid = players.every(p => p.name.trim());
    if (allNamesValid && !isLoading) {
      setIsLoading(true);
      onPartyCreate(players);
    }
  };
  
  const handleRenameClick = (save: SaveSlot) => {
    setRenamingId(save.id);
    setRenameText(save.name);
  };

  const handleRenameConfirm = (saveId: number) => {
      if (renameText.trim()) {
          onRenameGame(saveId, renameText);
      }
      setRenamingId(null);
      setRenameText('');
  };

  const handleStartHosting = async () => {
      setIsLoading(true);
      setJoinError(null);
      try {
          const id = await onHostGame();
          setHostId(id);
          setMultiplayerView('HOSTING');
          setGuestConnected(false);
      } catch (e: any) {
          console.error(e);
          setJoinError("Error al iniciar el servidor: " + (e.message || "Desconocido"));
      } finally {
          setIsLoading(false);
      }
  };

  const handleJoin = async () => {
      if (!joinIdInput) return;
      setIsLoading(true);
      setJoinError(null);
      try {
          // Trim input to avoid copy-paste spaces
          await onJoinGame(joinIdInput.trim());
          setMultiplayerView('JOINING');
      } catch (e: any) {
          console.error(e);
          setJoinError("Error al unirse: " + (e.message || "Verifica el código e intenta de nuevo."));
      } finally {
          setIsLoading(false);
      }
  };

  const allNamesFilled = players.every(p => p.name.trim().length > 0);
  
  const sortedSavedGames = [...savedGames].sort((a, b) => b.id - a.id);

  // View for Joining a Game (Guest)
  if (multiplayerView === 'JOINING') {
      return (
          <div className="max-w-2xl mx-auto parchment p-10 rounded-lg text-center">
               <LoadingSpinner />
               <h2 className="font-display text-3xl font-bold text-stone-800 mt-6 mb-2">Conectado al Líder</h2>
               <p className="text-stone-600 italic mb-8">Esperando a que el anfitrión inicie la aventura...</p>
               <p className="text-sm text-stone-500">Tú controlas las decisiones cuando sea tu turno. El anfitrión maneja la IA.</p>
          </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto parchment p-8 sm:p-12 rounded-lg">
      <h2 className="font-display text-4xl font-bold text-center text-stone-700 mb-8 text-shadow">Elige tu Aventura</h2>
      
      {/* Multiplayer Controls Header */}
      <div className="flex flex-col items-center gap-4 mb-8">
          {multiplayerView === 'NONE' && (
              <>
                <div className="flex gap-4 items-center">
                    <button 
                        onClick={handleStartHosting}
                        disabled={isLoading}
                        className="px-4 py-2 bg-stone-800 text-stone-200 rounded hover:bg-stone-700 transition-colors text-sm font-bold disabled:opacity-50"
                    >
                        Crear Sala Multijugador
                    </button>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Código de Sala" 
                            className="px-3 py-2 border border-stone-400 rounded bg-white/50 text-sm w-40"
                            value={joinIdInput}
                            onChange={(e) => setJoinIdInput(e.target.value)}
                        />
                        <button 
                            onClick={handleJoin}
                            disabled={!joinIdInput || isLoading}
                            className="px-4 py-2 bg-amber-800 text-white rounded hover:bg-amber-700 transition-colors disabled:opacity-50 text-sm font-bold"
                        >
                            Unirse
                        </button>
                    </div>
                </div>
                {joinError && (
                    <div className="bg-red-100 text-red-700 px-4 py-2 rounded border border-red-300 text-sm">
                        {joinError}
                    </div>
                )}
              </>
          )}
      </div>

      {/* Hosting View */}
      {multiplayerView === 'HOSTING' && (
          <div className="mb-8 p-4 bg-amber-100/50 border border-amber-800/30 rounded text-center">
              <p className="font-bold text-amber-900 mb-2">¡Sala Creada!</p>
              <p className="text-stone-600 text-sm mb-2">Comparte este código con tu amigo:</p>
              <div className="bg-white border border-stone-300 p-2 rounded inline-block font-mono text-lg font-bold tracking-wider select-all">
                  {hostId}
              </div>
              <p className="text-xs text-stone-500 mt-4 italic">
                 Configura el grupo abajo y pulsa "Comenzar Aventura". Tu amigo recibirá los datos automáticamente.
              </p>
              <button onClick={() => setMultiplayerView('NONE')} className="mt-2 text-xs text-red-600 hover:underline">Cancelar</button>
          </div>
      )}
      
      {/* Saved Games List */}
      {hasSavedGames && multiplayerView === 'NONE' && (
        <div className="mb-12">
            <h3 className="font-display text-3xl font-bold text-stone-700 mb-4 text-center pb-3">Continuar una Aventura</h3>
            <div className="space-y-3 max-w-3xl mx-auto mt-6">
              {sortedSavedGames.map((save) => (
                  <div key={save.id} className="flex items-center justify-between p-3 bg-stone-800/5 rounded-lg border border-stone-400/30 hover:border-stone-500/50 transition-colors">
                      <div className="flex-grow mr-4">
                          {renamingId === save.id ? (
                            <input 
                              type="text"
                              value={renameText}
                              onChange={(e) => setRenameText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleRenameConfirm(save.id)}
                              className="w-full bg-transparent border-b-2 border-amber-800 focus:border-amber-600 py-1 px-1 text-stone-800 leading-tight focus:outline-none focus:ring-0 transition-colors"
                              autoFocus
                              onBlur={() => handleRenameConfirm(save.id)}
                            />
                          ) : (
                            <>
                              <p className="font-bold text-stone-800 text-left">{save.name}</p>
                              <p className="text-xs text-stone-500 text-left">Guardado: {new Date(save.savedAt).toLocaleString()}</p>
                            </>
                          )}
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                           {renamingId === save.id ? (
                            <>
                              <button onClick={() => handleRenameConfirm(save.id)} className="p-2 text-green-700 hover:text-green-500 transition-colors" aria-label="Guardar nombre">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                              </button>
                              <button onClick={() => setRenamingId(null)} className="p-2 text-red-700 hover:text-red-500 transition-colors" aria-label="Cancelar renombrar">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                              </button>
                            </>
                           ) : (
                            <>
                              <button onClick={() => onLoadGame(save.id)} className="bg-amber-800 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors duration-300 shadow-sm hover:shadow-md">
                                  Cargar
                              </button>
                              <button onClick={() => handleRenameClick(save)} className="p-2 text-stone-500 hover:text-stone-800 transition-colors" aria-label={`Renombrar ${save.name}`}>
                                <EditIcon />
                              </button>
                              <button onClick={() => onDeleteGame(save.id)} className="p-2 text-red-800/70 hover:text-red-600 transition-colors" aria-label={`Borrar ${save.name}`}>
                                 <TrashIcon />
                              </button>
                            </>
                           )}
                      </div>
                  </div>
              ))}
            </div>
        </div>
      )}

      <hr className="decorative" />
      <div className="pt-8">
        <h3 className="font-display text-3xl font-bold text-center text-stone-700 mb-2">Forjar una Nueva Leyenda</h3>
        <p className="text-center text-stone-600 mb-8">{hasSavedGames ? 'Esto creará una nueva ranura de guardado. Si ya tienes 5, la más antigua será reemplazada.' : 'Cread vuestro grupo y comenzad una historia épica.'}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <label className="block text-stone-700 text-lg font-bold mb-3 text-center">Número de Jugadores</label>
            <div className="flex justify-center space-x-2">
              {Array.from({ length: MAX_PLAYERS }, (_, i) => i + 1).map(num => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setPlayerCount(num)}
                  disabled={isLoading}
                  className={`w-12 h-12 border-2 rounded-full font-bold transition-all duration-200 ${playerCount === num ? 'bg-amber-800/20 border-amber-800 text-amber-900 scale-110 shadow-inner' : 'bg-transparent border-stone-400 hover:border-amber-700/70'}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-12">
              {players.map((player, index) => {
                  const selectedClassInfo = classOptions.find(opt => opt.class === player.characterClass);
                  const selectedRaceInfo = raceOptions.find(opt => opt.race === player.race);
                  
                  return (
                      <div key={index} className="border-t-2 border-dotted border-stone-400/70 pt-8">
                           <h4 className="font-display text-2xl text-stone-800/90 mb-4">Jugador {index + 1}</h4>
                           <div className="mb-6">
                              <label htmlFor={`name-${index}`} className="block text-stone-700 text-sm font-bold mb-2">
                                  Nombre del Personaje
                              </label>
                              <input
                                  id={`name-${index}`}
                                  type="text"
                                  value={player.name}
                                  onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                                  className="w-full bg-transparent border-b-2 border-stone-400 focus:border-amber-800 py-2 px-1 text-stone-800 leading-tight focus:outline-none focus:ring-0 transition-colors text-lg"
                                  placeholder={`Ej: Héroe ${index + 1}`}
                                  required
                                  disabled={isLoading}
                              />
                          </div>

                           <div className="mb-6">
                              <label className="block text-stone-700 text-sm font-bold mb-3">
                                  Raza
                              </label>
                              <div className="grid grid-cols-5 gap-2 mb-2">
                                {raceOptions.map(opt => (
                                     <button 
                                          type="button"
                                          key={opt.race}
                                          onClick={() => updatePlayer(index, 'race', opt.race)}
                                          disabled={isLoading}
                                          className={`p-2 border-2 rounded-md transition-all duration-200 ${player.race === opt.race ? 'border-amber-700 bg-amber-800/10 scale-105 shadow-md' : 'border-stone-400/50 bg-stone-800/5 hover:border-amber-700/70'}`}
                                          title={opt.race}
                                      >
                                          <div className="w-8 h-8 mx-auto text-stone-700">{opt.icon}</div>
                                      </button>
                                ))}
                              </div>
                               {selectedRaceInfo && (
                                  <div className="text-xs text-stone-600 italic text-center h-8">
                                      <span className="font-bold">{selectedRaceInfo.race}:</span> {selectedRaceInfo.description}
                                  </div>
                              )}
                           </div>

                           <div className="mb-4">
                              <label className="block text-stone-700 text-sm font-bold mb-3">
                                  Clase
                              </label>
                              <div className="grid grid-cols-5 gap-2 mb-4">
                                  {classOptions.map(opt => (
                                      <button 
                                          type="button"
                                          key={opt.class}
                                          onClick={() => updatePlayer(index, 'characterClass', opt.class)}
                                          disabled={isLoading}
                                          className={`p-2 border-2 rounded-md transition-all duration-200 ${player.characterClass === opt.class ? 'border-amber-700 bg-amber-800/10 scale-105 shadow-md' : 'border-stone-400/50 bg-stone-800/5 hover:border-amber-700/70'}`}
                                          title={opt.class}
                                      >
                                          <div className="w-8 h-8 mx-auto text-stone-700">{opt.icon}</div>
                                      </button>
                                  ))}
                              </div>
                              {selectedClassInfo && (
                                  <div className="p-3 bg-amber-800/5 border border-amber-800/20 rounded-md mt-4">
                                      <h5 className="font-bold text-amber-900">{selectedClassInfo.class}</h5>
                                      <p className="text-sm text-stone-600">{selectedClassInfo.description}</p>
                                  </div>
                              )}
                          </div>
                      </div>
                  );
              })}
          </div>
          
          {error && <p className="text-red-700 text-center mt-6 mb-4">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || !allNamesFilled}
            className="w-full mt-10 font-display text-2xl bg-amber-800 hover:bg-amber-700 disabled:bg-stone-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-800/50 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                Forjando Leyendas...
              </>
            ) : (
              'Comenzar Aventura'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CharacterCreation;
