
import { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'FIRST_STEPS',
        title: 'El Comienzo',
        description: 'Inicia tu primera aventura.',
        emoji: '🗺️'
    },
    {
        id: 'FULL_HOUSE',
        title: 'La Comunidad',
        description: 'Crea un grupo completo de 5 aventureros.',
        emoji: '🖐️'
    },
    {
        id: 'FIRST_BLOOD',
        title: 'Primera Sangre',
        description: 'Gana tu primer combate.',
        emoji: '⚔️'
    },
    {
        id: 'LEVEL_UP',
        title: 'Poder Creciente',
        description: 'Alcanza el nivel 2 con cualquier personaje.',
        emoji: '✨'
    },
    {
        id: 'VETERAN',
        title: 'Veterano de Guerra',
        description: 'Alcanza el nivel 5.',
        emoji: '🏅'
    },
    {
        id: 'BOSS_SLAYER',
        title: 'Matagigantes',
        description: 'Derrota a un Jefe o enemigo formidable.',
        emoji: '👑',
        isHidden: true
    },
    {
        id: 'SECRET_KEEPER',
        title: 'Ojos de Águila',
        description: 'Descubre un secreto, pasaje oculto o tesoro escondido.',
        emoji: '🔍',
        isHidden: true
    },
    {
        id: 'SURVIVOR',
        title: 'Al Borde de la Muerte',
        description: 'Sobrevive a un combate con menos de 5 PV.',
        emoji: '❤️‍🩹',
        isHidden: true
    },
    {
        id: 'RICH',
        title: 'Cazafortunas',
        description: 'Obtén un objeto legendario o una gran recompensa.',
        emoji: '💎',
        isHidden: true
    },
    {
        id: 'PACIFIST',
        title: 'Diplomático',
        description: 'Resuelve un conflicto sin luchar.',
        emoji: '🕊️',
        isHidden: true
    }
];
