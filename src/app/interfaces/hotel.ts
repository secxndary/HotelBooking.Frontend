import { Room } from "./room";
import { User } from "./user";

export interface Hotel {
    id: string;
    name: string;
    description: string;
    stars: number;
    address: string;
    rooms: Room[];
    reservedRooms: Room[];
    hotelOwnerId: string;
    hotelOwner: User;
}