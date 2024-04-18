import { Room } from "./room";
import { User } from "./user";

export interface Hotel {
    id: string;
    name: string;
    description: string;
    stars: number;
    rooms: Room[];
    hotelOwnerId: string;
    hotelOwner: User;
}