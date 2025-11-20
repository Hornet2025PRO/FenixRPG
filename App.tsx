
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Character, Scene, HistoryEntry, PlayerInput, SaveSlot, NetworkMessage } from './types';
import { CharacterClass, CombatTactic, CharacterRace, GameState, MultiplayerMode } from './types';
import { createAdventure, getGameUpdate } from './services/geminiService';
import { peerService } from './services/peerService';
import CharacterCreation from './components/CharacterCreation';
import GameScreen from './components/GameScreen';
import { SkullIcon } from './components/icons';

const SAVE_GAME_KEY = 'fenixrpg_saved_games';
const MAX_SAVES = 5;
const ACTION_THROTTLE_MS = 10000; // 10 seconds

// Helper para traducir errores técnicos a narrativa o mensajes claros
const getFriendlyErrorMessage = (err: any): string => {
    console.error("App Error:", err);
    if (!err) return "Una perturbación en la magia ha impedido tu acción. Inténtalo de nuevo.";

    const message = typeof err === 'string' ? err : (err.message || JSON.stringify(err));
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('quota') || lowerMsg.includes('resource_exhausted') || lowerMsg.includes('429')) {
        return "⏳ Los hilos del destino están sobrecargados (Límite de API alcanzado). Espera un momento antes de intentar de nuevo.";
    }
    if (lowerMsg.includes('overloaded') || lowerMsg.includes('503')) {
        return "😵 El Dungeon Master está mareado (Servidores sobrecargados). Intenta tu acción nuevamente.";
    }
    if (lowerMsg.includes('safety') || lowerMsg.includes('blocked')) {
        return "🛡️ Una fuerza divina impide esa acción (Filtro de contenido activado). Por favor, elige otra opción o reformula.";
    }
    if (lowerMsg.includes('network') || lowerMsg.includes('fetch')) {
        return "📡 Se ha perdido la conexión con el plano astral (Error de red). Verifica tu internet.";
    }
    if (lowerMsg.includes('json') || lowerMsg.includes('parse')) {
        return "📜 El pergamino es ilegible (Error de formato de datos). Intenta de nuevo, la IA podría corregirse sola.";
    }

    return "⚠️ Algo salió mal en la aventura. Intenta realizar la acción nuevamente.";
};

// Componente Pantalla de Muerte
const GameOverScreen: React.FC<{ onRestart: () => void }> = ({ onRestart }) => (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-center p-4 animate-fade-in">
        <div className="text-red-800 w-32 h-32 mb-6 animate-pulse">
            <SkullIcon />
        </div>
        <h1 className="font-display text-6xl md:text-8xl text-red-700 font-bold mb-4 text-shadow tracking-widest">HAS MUERTO</h1>
        <p className="text-stone-400 text-xl md:text-2xl mb-8 font-serif italic">Tu leyenda termina aquí. Tu partida ha sido borrada.</p>
        <button 
            onClick={onRestart}
            className="px-8 py-3 bg-transparent border-2 border-red-800 text-red-800 hover:bg-red-900/20 hover:text-red-600 font-display font-bold text-xl transition-all duration-300 rounded"
        >
            Regresar al Menú
        </button>
    </div>
);

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.LOADING);
  const [party, setParty] = useState<Character[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [scene, setScene] = useState<Scene | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [savedGames, setSavedGames] = useState<SaveSlot[]>([]);
  const [currentSaveId, setCurrentSaveId] = useState<number | null>(null);
  const [isThrottled, setIsThrottled] = useState(false);
  
  // Multiplayer States
  const [multiplayerMode, setMultiplayerMode] = useState<MultiplayerMode>(MultiplayerMode.OFFLINE);
  const actionInProgress = useRef(false);

  useEffect(() => {
    try {
      const savedGamesJSON = localStorage.getItem(SAVE_GAME_KEY);
      if (savedGamesJSON) {
        setSavedGames(JSON.parse(savedGamesJSON));
      }
    } catch (e) {
      console.error("Failed to read from local storage", e);
    }
    setGameState(GameState.CHARACTER_CREATION);
  }, []);

  // Setup PeerJS Listener
  useEffect(() => {
      peerService.onData((data: NetworkMessage) => {
          console.log("App received data:", data);
          
          if (data.type === 'SYNC_STATE') {
              // Client receives state from Host
              setParty(data.payload.party);
              setScene(data.payload.scene);
              setHistory(data.payload.history);
              setTurnIndex(data.payload.turnIndex);
              
              // Force state to Playing if we get data
              if (gameState !== GameState.GAME_OVER) {
                  setGameState(GameState.PLAYING);
              }
              setIsThrottled(false); // Unlock UI when new state arrives
          } else if (data.type === 'PLAYER_ACTION') {
              // Host receives action from Client
              if (multiplayerMode === MultiplayerMode.HOST) {
                  handlePlayerChoice(data.payload.choice);
              }
          } else if (data.type === 'GAME_START') {
              setGameState(GameState.PLAYING);
          }
      });
  }, [gameState, multiplayerMode]); // Re-bind if mode changes, though peerService is singleton

  // Helper to broadcast state to guests
  const broadcastState = useCallback((newParty: Character[], newScene: Scene, newHistory: HistoryEntry[], newTurnIndex: number) => {
      if (multiplayerMode === MultiplayerMode.HOST) {
          peerService.send({
              type: 'SYNC_STATE',
              payload: {
                  party: newParty,
                  scene: newScene,
                  history: newHistory,
                  turnIndex: newTurnIndex
              }
          });
      }
  }, [multiplayerMode]);


  const deleteGame = useCallback((saveId: number) => {
    try {
      const currentSaves = JSON.parse(localStorage.getItem(SAVE_GAME_KEY) || '[]');
      const updatedSaves = currentSaves.filter((s: SaveSlot) => s.id !== saveId);
      localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(updatedSaves));
      setSavedGames(updatedSaves);
    } catch (e) {
      console.error("Failed to delete game", e);
      setError("Error al intentar borrar la partida.");
    }
  }, []);

  const saveGame = useCallback(() => {
    if (!scene || !currentSaveId) return;
    if (gameState === GameState.GAME_OVER) return;
    // Don't save on guest
    if (multiplayerMode === MultiplayerMode.GUEST) return;

    try {
        let allSaves: SaveSlot[] = JSON.parse(localStorage.getItem(SAVE_GAME_KEY) || '[]');
        const gameStateToSave = {
            party,
            scene,
            history,
            turnIndex,
        };

        const existingSaveIndex = allSaves.findIndex(s => s.id === currentSaveId);

        if (existingSaveIndex !== -1) {
            allSaves[existingSaveIndex] = { ...allSaves[existingSaveIndex], ...gameStateToSave, savedAt: new Date().toISOString() };
        } else {
            return;
        }
        
        localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(allSaves));
        setSavedGames(allSaves);
    } catch (e) {
        console.error("Failed to save game", e);
        setError("No se pudo guardar la partida automáticamente.");
    }
  }, [party, scene, history, turnIndex, currentSaveId, gameState, multiplayerMode]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleUpdateTactic = useCallback((characterIndex: number, newTactic: CombatTactic) => {
    setParty(prevParty => {
        const newParty = [...prevParty];
        newParty[characterIndex] = { ...newParty[characterIndex], tactic: newTactic };
        return newParty;
    });
    // Note: In a full implementation, tactics updates should also be synced via P2P
  }, []);

  const handleHostGame = async (): Promise<string> => {
      const id = await peerService.initializeHost();
      setMultiplayerMode(MultiplayerMode.HOST);
      return id;
  };

  const handleJoinGame = async (hostId: string) => {
      await peerService.joinGame(hostId);
      setMultiplayerMode(MultiplayerMode.GUEST);
      setGameState(GameState.LOADING); // Wait for host
  };

  const handleCharacterCreation = useCallback(async (players: PlayerInput[]) => {
    if (actionInProgress.current) return;
    actionInProgress.current = true;

    setGameState(GameState.LOADING);
    setError(null);
    setCurrentSaveId(null); 
    try {
      const initialGameData = await createAdventure(players);
      
      const newHistory: HistoryEntry[] = [];
      const initialTurnIndex = 0;
      
      setScene(initialGameData.scene);
      setParty(initialGameData.party);
      setTurnIndex(initialTurnIndex);
      setHistory(newHistory);
      
      const tempSaveId = Date.now();
      setCurrentSaveId(tempSaveId);
      
      let allSaves: SaveSlot[] = JSON.parse(localStorage.getItem(SAVE_GAME_KEY) || '[]');
      const newSave: SaveSlot = {
          id: tempSaveId,
          name: `Aventura de ${initialGameData.party[0]?.name || 'Héroes'}`,
          savedAt: new Date().toISOString(),
          party: initialGameData.party,
          scene: initialGameData.scene,
          history: newHistory,
          turnIndex: initialTurnIndex,
      };
      
      allSaves.push(newSave);
      
      if (allSaves.length > MAX_SAVES) {
          allSaves = allSaves.sort((a, b) => a.id - b.id).slice(allSaves.length - MAX_SAVES);
      }
      localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(allSaves));
      setSavedGames(allSaves);
      
      setGameState(GameState.PLAYING);
      
      // Sync with Guest if hosting
      if (multiplayerMode === MultiplayerMode.HOST) {
          peerService.send({ type: 'GAME_START', payload: {} });
          // Delay slightly to ensure client is ready to receive state
          setTimeout(() => {
             broadcastState(initialGameData.party, initialGameData.scene, newHistory, initialTurnIndex);
          }, 500);
      }
      
      setTimeout(() => { actionInProgress.current = false; }, ACTION_THROTTLE_MS);

    } catch (err) {
      const errorMessage = getFriendlyErrorMessage(err);
      setError(errorMessage);
      setGameState(GameState.CHARACTER_CREATION);
      actionInProgress.current = false;
    }
  }, [multiplayerMode, broadcastState]);
  
  useEffect(() => {
      if (gameState === GameState.PLAYING && currentSaveId) {
          saveGame();
      }
  }, [party, scene, history, turnIndex, gameState, currentSaveId, saveGame]);


  const handlePlayerChoice = useCallback(async (choice: string) => {
    if (party.length === 0 || !scene || actionInProgress.current) return;
    
    // GUEST LOGIC: Just send choice to host
    if (multiplayerMode === MultiplayerMode.GUEST) {
        setIsThrottled(true); // Lock UI locally
        peerService.send({ type: 'PLAYER_ACTION', payload: { choice } });
        return;
    }

    // HOST/OFFLINE LOGIC
    actionInProgress.current = true;
    setIsThrottled(true);
    setGameState(GameState.LOADING);
    setError(null);

    const throttleTimer = setTimeout(() => {
        actionInProgress.current = false;
        setIsThrottled(false);
    }, ACTION_THROTTLE_MS);
    
    const previousSceneDescription = scene.description;
    const actingCharacterName = party[turnIndex].name;

    try {
      const gameUpdate = await getGameUpdate(party, turnIndex, choice, history, scene);
      
      const newHistory = [...history, { sceneDescription: previousSceneDescription, playerChoice: `${actingCharacterName}: ${choice}` }];
      
      const isSinglePlayer = gameUpdate.updatedParty.length === 1;
      const allDead = gameUpdate.updatedParty.every(p => p.stats.hp <= 0);
      
      if ((isSinglePlayer && allDead) || (gameUpdate.updatedParty.length > 0 && allDead)) {
          if (currentSaveId) {
              deleteGame(currentSaveId);
          }
          setHistory(newHistory);
          setScene(gameUpdate.scene);
          setParty(gameUpdate.updatedParty);
          setGameState(GameState.GAME_OVER);
          
          clearTimeout(throttleTimer);
          actionInProgress.current = false;
          setIsThrottled(false);
          return;
      }

      setHistory(newHistory);
      setScene(gameUpdate.scene);
      setParty(gameUpdate.updatedParty);
      setTurnIndex(gameUpdate.nextTurnIndex);
      
      setGameState(GameState.PLAYING);
      
      // Broadcast new state to guest
      if (multiplayerMode === MultiplayerMode.HOST) {
          broadcastState(gameUpdate.updatedParty, gameUpdate.scene, newHistory, gameUpdate.nextTurnIndex);
      }

    } catch (err) {
      clearTimeout(throttleTimer);
      actionInProgress.current = false;
      setIsThrottled(false);
      
      const errorMessage = getFriendlyErrorMessage(err);
      setError(errorMessage);
      setGameState(GameState.PLAYING);
    } 
  }, [party, scene, history, turnIndex, currentSaveId, deleteGame, multiplayerMode, broadcastState]);

  const loadGame = useCallback((saveId: number) => {
    setGameState(GameState.LOADING);
    setError(null);
    try {
        const savedGame = savedGames.find(s => s.id === saveId);
        if (savedGame) {
            const updatedParty = savedGame.party.map(p => ({
                ...p,
                tactic: p.tactic || CombatTactic.BALANCED,
                race: p.race || CharacterRace.HUMANO,
                level: p.level || 1,
                currentXp: p.currentXp || 0,
                nextLevelXp: p.nextLevelXp || 100
            }));
            setParty(updatedParty);
            setScene(savedGame.scene);
            setHistory(savedGame.history || []);
            setTurnIndex(savedGame.turnIndex);
            setCurrentSaveId(savedGame.id);
            setGameState(GameState.PLAYING);
            
            // If host loads game, sync immediately
            if (multiplayerMode === MultiplayerMode.HOST) {
                 // Brief delay to ensure connection stability
                 setTimeout(() => {
                    broadcastState(updatedParty, savedGame.scene, savedGame.history || [], savedGame.turnIndex);
                 }, 500);
            }

        } else {
            setError("No se encontró esa partida guardada.");
            setGameState(GameState.CHARACTER_CREATION);
        }
    } catch (e) {
        console.error("Failed to load saved game", e);
        setError("El archivo de guardado está corrupto y no se puede leer.");
        setGameState(GameState.CHARACTER_CREATION);
    }
  }, [savedGames, multiplayerMode, broadcastState]);

  const renameGame = useCallback((saveId: number, newName: string) => {
    try {
        const updatedSaves = savedGames.map(s => 
            s.id === saveId ? { ...s, name: newName.trim() || s.name } : s
        );
        localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(updatedSaves));
        setSavedGames(updatedSaves);
    } catch (e) {
        console.error("Failed to rename game", e);
        setError("Error al renombrar la partida.");
    }
  }, [savedGames]);

  const goToMainMenu = () => {
    setGameState(GameState.CHARACTER_CREATION);
    setParty([]);
    setScene(null);
    setHistory([]);
    setError(null);
    setTurnIndex(0);
    setCurrentSaveId(null);
    setMultiplayerMode(MultiplayerMode.OFFLINE);
    peerService.disconnect();
  };

  const renderContent = () => {
     if (gameState === GameState.GAME_OVER) {
         return <GameOverScreen onRestart={goToMainMenu} />;
     }

     // Show loading specific message based on multiplayer role
     if (gameState === GameState.LOADING && party.length === 0) {
      let loadingText = "Invocando al Dungeon Master...";
      if (multiplayerMode === MultiplayerMode.GUEST) loadingText = "Sincronizando con el Líder del Grupo...";
      
      return (
        <div className="text-center p-10">
          <p className="text-stone-600 text-lg animate-pulse">{loadingText}</p>
        </div>
      );
    }

    switch (gameState) {
      case GameState.CHARACTER_CREATION:
        return (
            <CharacterCreation 
                onPartyCreate={handleCharacterCreation} 
                onHostGame={handleHostGame}
                onJoinGame={handleJoinGame}
                error={error} 
                savedGames={savedGames} 
                onLoadGame={loadGame} 
                onDeleteGame={deleteGame} 
                onRenameGame={renameGame}
            />
        );
      case GameState.PLAYING:
      case GameState.LOADING:
        if (party.length > 0 && scene) {
          return (
            <GameScreen 
              party={party}
              currentTurnIndex={turnIndex}
              scene={scene} 
              history={history}
              onChoice={handlePlayerChoice} 
              isLoading={gameState === GameState.LOADING}
              isThrottled={isThrottled}
              onRestart={goToMainMenu}
              error={error}
              onClearError={clearError}
              onUpdateTactic={handleUpdateTactic}
            />
          );
        }
        // Fallback
        goToMainMenu();
        return <div>Error de estado. Reiniciando...</div>;
      default:
        return <div>Algo salió mal.</div>;
    }
  };

  return (
    <div className="min-h-screen text-stone-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {gameState !== GameState.GAME_OVER && (
            <header className="text-center mb-6">
            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold text-stone-800 tracking-wider text-shadow">
                FenixRPG
            </h1>
            <p className="text-stone-600 mt-2 italic">
                {multiplayerMode === MultiplayerMode.OFFLINE && "Tu Aventura Impulsada por IA"}
                {multiplayerMode === MultiplayerMode.HOST && "Multijugador (Anfitrión)"}
                {multiplayerMode === MultiplayerMode.GUEST && "Multijugador (Invitado)"}
            </p>
            <hr className="decorative max-w-sm mx-auto mt-4" />
            </header>
        )}
        <main>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
