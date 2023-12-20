import { Room } from "./room";

export interface Hotel {
    id: string;
    name: string;
    description: string;
    stars: number;
    rooms: Room[];
}