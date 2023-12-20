import { Hotel } from "./hotel";
import { Room } from "./room";
import { User } from "./user";

export interface Reservation {
    id: string,
    dateEntry: Date,
    dateExit: Date,
    userId: string,
    roomId: string,
    user: User,
    room: Room,
    hotel: Hotel
}