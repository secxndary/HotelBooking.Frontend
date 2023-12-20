import { RoomPhoto } from "./roomPhoto";

export interface Room {
    id: string;
    price: number;
    quantity: number;
    sleepingPlaces: number;
    hotelId: string;
    roomTypeId: string;
    roomPhotos: RoomPhoto[];
    totalPrice: number;
  }