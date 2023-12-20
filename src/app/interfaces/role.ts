import { User } from "./user";

export interface Role {
    id: string;
    name: string;
    users: User[];
}