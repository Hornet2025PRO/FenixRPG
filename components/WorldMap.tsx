
import React, { useMemo } from 'react';
import type { MapLocation, Character, Enemy } from '../types';
import { LocationType } from '../types';
import { 
    PlayerMarkerIcon, EnemyMarkerIcon, TownIcon, ForestIcon, CaveIcon, RuinsIcon, 
    PlainsIcon, MountainIcon, CryptIcon, DungeonIcon, GenericLocationIcon, CompassRoseIcon 
} from './icons';

interface WorldMapProps {
    locations: MapLocation[];
    party: Character[];
    enemies: Enemy[];
    currentLocationCoordinates: { x: number; y: number };
    onClose: () => void;
}

const GRID_CELL_SIZE = 64; // px; increased size
const PADDING = 2; // in grid units

// Fix: Corrected icon rendering logic.
const LocationIcon: React.FC<{type: LocationType}> = ({ type }) => {
    const commonProps = {
        className: "w-10 h-10 text-stone-600 opacity-70", // increased size
        "aria-hidden": "true" as const,
    };
    const IconComponent = {
        [LocationType.PUEBLO]: TownIcon,
        [LocationType.BOSQUE]: ForestIcon,
        [LocationType.CUEVA]: CaveIcon,
        [LocationType.RUINAS]: RuinsIcon,
        [LocationType.LLANURA]: PlainsIcon,
        [LocationType.MONTANA]: MountainIcon,
        [LocationType.CRIPTA]: CryptIcon,
        [LocationType.MAZMORRA]: DungeonIcon,
        [LocationType.GENERICO]: GenericLocationIcon,
    }[type] || GenericLocationIcon;

    return <IconComponent {...commonProps} />;
};


const WorldMap: React.FC<WorldMapProps> = ({ locations, party, enemies, currentLocationCoordinates, onClose }) => {
    
    const { minX, maxX, minY, maxY, width, height } = useMemo(() => {
        if (locations.length === 0) {
            return { minX: -PADDING, maxX: PADDING, minY: -PADDING, maxY: PADDING, width: PADDING * 2 + 1, height: PADDING * 2 + 1 };
        }

        const xCoords = locations.map(l => l.coordinates.x);
        const yCoords = locations.map(l => l.coordinates.y);

        const minX = Math.min(...xCoords) - PADDING;
        const maxX = Math.max(...xCoords) + PADDING;
        const minY = Math.min(...yCoords) - PADDING;
        const maxY = Math.max(...yCoords) + PADDING;

        return { minX, maxX, minY, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
    }, [locations]);

    const mapStyle = {
        width: `${width * GRID_CELL_SIZE}px`,
        height: `${height * GRID_CELL_SIZE}px`,
        gridTemplateColumns: `repeat(${width}, ${GRID_CELL_SIZE}px)`,
        gridTemplateRows: `repeat(${height}, ${GRID_CELL_SIZE}px)`,
    };
    
    // Fallback for old saves
    const getCharacterCoords = (character: Character) => character.mapCoordinates || currentLocationCoordinates;
    const getEnemyCoords = (enemy: Enemy) => enemy.mapCoordinates || currentLocationCoordinates;

    const LegendItem: React.FC<{icon: React.ReactNode, label: string}> = ({icon, label}) => (
        <div className="flex items-center gap-2">
            <div className="w-5 h-5 flex-shrink-0">{icon}</div>
            <span className="text-xs">{label}</span>
        </div>
    );

    return (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="parchment p-4 sm:p-6 rounded-lg shadow-2xl relative max-w-full max-h-full flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-stone-600 hover:text-stone-900 transition-colors z-20"
                    aria-label="Cerrar mapa"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
                <h2 className="font-display text-3xl text-center mb-4 text-shadow text-stone-800 flex-shrink-0">Mapa del Mundo</h2>

                <div className="flex-grow overflow-auto border-2 border-amber-800/20 bg-[#f3e9d2] p-2 relative min-h-0">
                    <div className="absolute top-2 left-2 w-16 h-16 text-stone-600 opacity-50 z-10"><CompassRoseIcon/></div>
                    <div className="relative w-full h-full">
                        <div 
                            className="grid absolute inset-0" 
                            style={mapStyle}
                            aria-label="Cuadrícula del mapa"
                        >
                            {Array.from({ length: width * height }).map((_, i) => (
                               <div key={i} className="border border-stone-400/20"></div>
                            ))}
                        </div>

                        {/* Render locations */}
                        {locations.map((loc) => {
                            const gridX = loc.coordinates.x - minX;
                            const gridY = loc.coordinates.y - minY;
                            const isCurrent = loc.coordinates.x === currentLocationCoordinates.x && loc.coordinates.y === currentLocationCoordinates.y;
                            
                            const markerStyle = {
                                top: `${gridY * GRID_CELL_SIZE}px`,
                                left: `${gridX * GRID_CELL_SIZE}px`,
                                width: `${GRID_CELL_SIZE}px`,
                                height: `${GRID_CELL_SIZE}px`,
                            };
                            
                            return (
                                <div key={loc.name} className="absolute flex items-center justify-center group" style={markerStyle}>
                                    <LocationIcon type={loc.type} />
                                    {isCurrent && <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-pulse"></div>}
                                     <div className="absolute bottom-full mb-2 w-max px-2 py-1 text-xs text-white bg-stone-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                        {loc.name} ({loc.type})
                                    </div>
                                </div>
                            );
                        })}

                        {/* Render Party */}
                        {party.map((character, index) => {
                             const coords = getCharacterCoords(character);
                             const gridX = coords.x - minX;
                             const gridY = coords.y - minY;
                             const partyCount = party.length;
                             const angle = (index / partyCount) * 2 * Math.PI;
                             const radius = partyCount > 1 ? GRID_CELL_SIZE * 0.15 : 0;
                             const offsetX = Math.cos(angle) * radius;
                             const offsetY = Math.sin(angle) * radius;
                             const markerStyle = {
                                top: `${gridY * GRID_CELL_SIZE + GRID_CELL_SIZE * 0.5 + offsetY}px`,
                                left: `${gridX * GRID_CELL_SIZE + GRID_CELL_SIZE * 0.5 + offsetX}px`,
                                transform: `translate(-50%, -50%)`,
                             };
                             return <div key={character.name} className="absolute group z-10" style={markerStyle}>
                                        <PlayerMarkerIcon className="text-blue-600 drop-shadow-lg"/>
                                        <div className="absolute bottom-full mb-1 w-max px-2 py-1 text-xs text-white bg-blue-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">{character.name}</div>
                                    </div>
                        })}

                        {/* Render Enemies */}
                         {enemies.map((enemy, index) => {
                             const coords = getEnemyCoords(enemy);
                             const gridX = coords.x - minX;
                             const gridY = coords.y - minY;
                             const enemyCount = enemies.length;
                             const angle = (index / enemyCount) * 2 * Math.PI;
                             const radius = enemyCount > 1 ? GRID_CELL_SIZE * 0.2 : 0;
                             const offsetX = Math.cos(angle) * radius;
                             const offsetY = Math.sin(angle) * radius;
                             const markerStyle = {
                                top: `${gridY * GRID_CELL_SIZE + GRID_CELL_SIZE * 0.5 + offsetY}px`,
                                left: `${gridX * GRID_CELL_SIZE + GRID_CELL_SIZE * 0.5 + offsetX}px`,
                                transform: `translate(-50%, -50%)`,
                             };
                             return <div key={`${enemy.name}-${index}`} className="absolute group z-10" style={markerStyle}>
                                        <EnemyMarkerIcon className="text-red-700 drop-shadow-lg"/>
                                        <div className="absolute bottom-full mb-1 w-max px-2 py-1 text-xs text-white bg-red-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">{enemy.name}</div>
                                    </div>
                        })}
                    </div>
                </div>

                <div className="mt-4 p-3 bg-stone-800/5 rounded-md border border-stone-400/30 flex-shrink-0">
                    <h4 className="font-display text-sm font-bold text-stone-700 mb-2">Leyenda</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-stone-700">
                        <LegendItem icon={<PlayerMarkerIcon className="text-blue-600"/>} label="Jugador"/>
                        <LegendItem icon={<EnemyMarkerIcon className="text-red-700"/>} label="Enemigo"/>
                        {/* Fix: Correctly render icon components without SVG wrapper. */}
                        <LegendItem icon={<TownIcon className="w-5 h-5"/>} label="Pueblo"/>
                        <LegendItem icon={<ForestIcon className="w-5 h-5"/>} label="Bosque"/>
                        <LegendItem icon={<MountainIcon className="w-5 h-5"/>} label="Montaña"/>
                        <LegendItem icon={<CaveIcon className="w-5 h-5"/>} label="Cueva"/>
                        <LegendItem icon={<RuinsIcon className="w-5 h-5"/>} label="Ruinas"/>
                        <LegendItem icon={<PlainsIcon className="w-5 h-5"/>} label="Llanura"/>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorldMap;
