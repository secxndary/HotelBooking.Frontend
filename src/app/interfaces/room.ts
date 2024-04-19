import { RoomPhoto } from "./roomPhoto";
import { RoomType } from "./roomType";

export interface Room {
    id: string;
    price: number;
    quantity: number;
    quantityReserved: number;
    sleepingPlaces: number;
    hotelId: string;
    roomTypeId: string;
    roomType: RoomType | undefined;
    roomPhotos: RoomPhoto[];
    totalPrice: number;
  }