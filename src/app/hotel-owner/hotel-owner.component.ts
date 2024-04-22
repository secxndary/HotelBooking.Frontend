import { Component } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Modal } from 'flowbite';
import { NotificationService } from '../notification.service';
import { AuthService } from '../auth.service';
import { Hotel } from '../interfaces/hotel';
import { environment } from '../../environments/environments';
import { User } from '../interfaces/user';
import { UserService } from '../user.service';
import { Room } from '../interfaces/room';
import { RoomType } from '../interfaces/roomType';

@Component({
  selector: 'app-hotel-owner',
  templateUrl: './hotel-owner.component.html',
  styleUrls: ['./hotel-owner.component.scss']
})
export class HotelOwnerComponent {
  hotels: Hotel[] = [];
  hotelOwner!: User;
  roomTypes: RoomType[] = [];

  currentHotel!: Hotel;
  currentRoom!: Room;

  hotelForm!: FormGroup;
  hotelFormCreate!: FormGroup;
  roomForm!: FormGroup;
  roomFormCreate!: FormGroup;

  modal: any;
  modalCreate: any;
  modalRoom: any;
  modalCreateRoom: any;

  constructor(
    private httpClient: HttpClient,
    private authService: AuthService,
    private userService: UserService,
    private notificationService: NotificationService,
    private formBuilder: FormBuilder,
  ) { }

  ngOnInit() {
    this.userService.getUserFromToken()
      .subscribe(
        (user: User) => {
          this.hotelOwner = user;
          this.fetchHotelsByOwner();
          this.fetchRoomTypes();
          console.log('User: ', this.hotelOwner);
        },
        (error) => {
          console.error('Error fetching user details:', error);
          if (error.status === 500)
            this.authService.refreshTokens();
          else
            this.authService.navigateToAuth();
        }
      );

    this.hotelForm = this.formBuilder.group({
      name: undefined,
      description: undefined,
      address: undefined,
      stars: undefined
    });

    this.hotelFormCreate = this.formBuilder.group({
      name: undefined,
      description: undefined,
      address: undefined,
      stars: undefined
    });

    this.roomForm = this.formBuilder.group({
      price: undefined,
      quantity: 1,
      sleepingPlaces: undefined,
      roomTypeId: undefined,
    });

    this.roomFormCreate = this.formBuilder.group({
      price: undefined,
      quantity: 1,
      sleepingPlaces: undefined,
      roomTypeId: undefined,
    });

    this.hotels.forEach(element => {
      this.fetchRoomsForHotel(element);
    });
  }

  fetchHotelsByOwner() {
    const hotelsUrl = `${environment.API_HOSTNAME}/hotels/owner/${this.hotelOwner.id}`;
    const headers = this.authService.getAuthenticationHeader();
    const params = new HttpParams()
      .set('pageSize', 50)
      .set('orderBy', 'name asc');

    this.httpClient.get<Hotel[]>(hotelsUrl, { headers, params })
      .subscribe(
        (hotelDataArray: Hotel[]) => {
          this.hotels = hotelDataArray;
          console.log(this.hotels);
          this.hotels.forEach(hotel => {
            this.fetchRoomsForHotel(hotel);
          });
        },
        (error) => { console.error('Error fetching hotel info:', error); }
      );
  }

  fetchRoomsForHotel(hotel: Hotel): Room[] | void {
    const roomsUrl = `${environment.API_HOSTNAME}/hotels/${hotel?.id}/rooms`;
    const headers = this.authService.getAuthenticationHeader();
    const params = new HttpParams()
      .set('isActive', 'true');

    this.httpClient.get<Room[]>(roomsUrl, { headers })
      .subscribe(
        (rooms: Room[]) => {
          hotel.rooms = rooms;
          console.log('hotel.rooms', hotel.rooms)

          hotel.rooms.forEach(room => {
            this.httpClient.get<Room[]>(`${environment.API_HOSTNAME}/rooms/${room.id}/reservations`, { headers, params })
              .subscribe(
                (reservedRooms: Room[]) => {
                  hotel.reservedRooms = reservedRooms;
                  room.quantityReserved = hotel.reservedRooms.length;
                  console.log('hotel.reservedRooms', hotel.reservedRooms)
                },
                (error) => { console.error('Error fetching room info:', error); }
              );
          });

        },
        (error) => { console.error('Error fetching room info:', error); }
      );


  }

  fetchRoomTypes(): void {
    const roomTypesUrl = `${environment.API_HOSTNAME}/roomTypes`;
    const headers = this.authService.getAuthenticationHeader();

    this.httpClient.get<RoomType[]>(roomTypesUrl, { headers })
      .subscribe(
        (data: RoomType[]) => {
          this.roomTypes = data;
        },
        (error) => {
          console.error('Error fetching room types:', error);
        }
      );
  }


  createHotel() {
    const hotelsUrl = `${environment.API_HOSTNAME}/hotels`;
    const headers = this.authService.getAuthenticationHeader();

    const name = this.hotelFormCreate.get('name')?.value;
    const description = this.hotelFormCreate.get('description')?.value;
    const stars = this.hotelFormCreate.get('stars')?.value
    const address = this.hotelFormCreate.get('address')?.value
    const hotelOwnerId = this.hotelOwner?.id;

    const body = { name, description, stars, hotelOwnerId, address };

    this.httpClient.post(hotelsUrl, body, { headers })
      .subscribe(
        (res) => {
          this.fetchHotelsByOwner();
          this.notificationService.showSuccess('Отель создан!', '');
          this.closeModalCreate();
        },
        (error) => {
          console.error('Error fetching hotel info:', error);
          if (error.status === 422)
            this.notificationService.showError(`${error.error.Stars[0]}`, 'Ошибка!');
          else
            this.notificationService.showError('Не удалось создать отель', 'Ошибка!');
        }
      );
  }

  updateHotel(hotelId: string) {
    const hotelsUrl = `${environment.API_HOSTNAME}/hotels/${hotelId}`;
    const headers = this.authService.getAuthenticationHeader();

    const name = this.hotelForm.get('name')?.value;
    const description = this.hotelForm.get('description')?.value;
    const stars = this.hotelForm.get('stars')?.value
    const address = this.hotelForm.get('address')?.value
    const hotelOwnerId = this.hotelOwner?.id;

    const body = { name, description, stars, hotelOwnerId, address };

    this.httpClient.put(hotelsUrl, body, { headers })
      .subscribe(
        (res) => {
          this.fetchHotelsByOwner();
          this.notificationService.showSuccess('Отель успешно обновлён!', '');
          console.log(`Update hotel with ID: ${hotelId}`);
          this.closeModal();
        },
        (error) => {
          console.error('Error fetching hotel info:', error);
          if (error.status === 422)
            this.notificationService.showError(`${error.error.Stars[0]}`, 'Ошибка!');
          else
            this.notificationService.showError('Отель не удалось обновить', 'Ошибка!');
        }
      );
  }

  deleteHotel(hotelId: string) {
    const hotelsUrl = `${environment.API_HOSTNAME}/hotels/${hotelId}`;
    const headers = this.authService.getAuthenticationHeader();

    this.httpClient.delete(hotelsUrl, { headers })
      .subscribe(
        (res) => {
          console.log(`Delete hotel with ID: ${hotelId}`);
          console.log(this.hotels);
          this.fetchHotelsByOwner();
          this.notificationService.showSuccess('Отель успешно удалён', '');
        },
        (error) => {
          console.error('Error fetching hotel info:', error);
          this.notificationService.showError('Отель не получилось удалить', 'Ошибка!');
        }
      );
  }


  createRoom(hotel: Hotel) {
    const roomsUrl = `${environment.API_HOSTNAME}/hotels/${hotel?.id}/rooms`;
    const headers = this.authService.getAuthenticationHeader();

    const price = this.roomFormCreate.get('price')?.value;
    const sleepingPlaces = this.roomFormCreate.get('sleepingPlaces')?.value;
    const quantity = this.roomFormCreate.get('quantity')?.value;
    const roomTypeId = this.roomFormCreate.get('roomTypeId')?.value;

    console.log('roomTypeId', roomTypeId)

    const body = { price, sleepingPlaces, quantity, roomTypeId };

    this.httpClient.post(roomsUrl, body, { headers })
      .subscribe(
        (res) => {
          // this.fetchRoomsForHotel();
          this.notificationService.showSuccess('Комната создана!', '');
          this.closeModalCreateRoom();
        },
        (error) => {
          console.error('Error fetching room info:', error);
          if (error.status === 422)
            this.notificationService.showError(`${error.error.Stars[0]}`, 'Ошибка!');
          else
            this.notificationService.showError('Не удалось создать комнату', 'Ошибка!');
        }
      );

    setTimeout(() => {
      window.location.reload()
    }, 500);
  }


  updateRoom(hotelId: string, roomId: string) {
    const roomsUrl = `${environment.API_HOSTNAME}/hotels/${hotelId}/rooms/${roomId}`;
    const headers = this.authService.getAuthenticationHeader();

    const price = this.roomForm.get('price')?.value;
    const sleepingPlaces = this.roomForm.get('sleepingPlaces')?.value;
    const quantity = this.roomForm.get('quantity')?.value;
    const roomTypeId = this.roomForm.get('roomTypeId')?.value;

    const body = { price, sleepingPlaces, quantity, roomTypeId };

    this.httpClient.put(roomsUrl, body, { headers })
      .subscribe(
        (res) => {
          // this.fetchRoomsByOwner();
          this.notificationService.showSuccess('Комната успешно обновлена!', '');
          console.log(`Update room with ID: ${roomId}`);

          setTimeout(() => {
            this.closeModalRoom();
            window.location.reload();
          }, 500);
        },
        (error) => {
          console.error('Error fetching room info:', error);
          if (error.status === 422)
            this.notificationService.showError(`${error.error.Stars[0]}`, 'Ошибка!');
          else
            this.notificationService.showError('Отель не удалось обновить', 'Ошибка!');
        }
      );
  }


  deleteRoom(hotelId: string, roomId: string) {
    const roomsUrl = `${environment.API_HOSTNAME}/hotels/${hotelId}/rooms/delete/${roomId}`;
    const headers = this.authService.getAuthenticationHeader();

    this.httpClient.delete(roomsUrl, { headers })
      .subscribe(
        (res) => {
          console.log(`Delete room with ID: ${roomId}`);
          this.notificationService.showSuccess('Комната успешно удалена', '');
        },
        (error) => {
          console.error('Error fetching room info:', error);
          this.notificationService.showError('Комнату не получилось удалить', 'Ошибка!');
        }
      );

    setTimeout(() =>
      // window.location.reload(),
      200);
  }

  openModal(hotel: Hotel) {
    const targetEl = document.getElementById("modalEl");
    const options = {
      modalPlacement: "bottom-right",
      modalBackdrop: "static",
      backdropClasses:
        "bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"
    };

    this.currentHotel = hotel;
    this.initializeFormWithHotelData();

    const modal = new Modal(targetEl, options);
    this.modal = modal;
    this.modal.show();
  }

  openModalCreate() {
    const targetEl = document.getElementById("create-modal");
    const options = {
      modalPlacement: "bottom-right",
      modalBackdrop: "static",
      backdropClasses:
        "bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"
    };

    const modal = new Modal(targetEl, options);
    this.modalCreate = modal;
    this.modalCreate.show();
  }


  openModalRoom(hotel: Hotel, room: Room) {
    const targetEl = document.getElementById("modal-room");
    const options = {
      modalPlacement: "bottom-right",
      modalBackdrop: "static",
      backdropClasses:
        "bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"
    };

    this.currentRoom = room;
    this.currentHotel = hotel;
    this.initializeFormWithRoomData();

    const modal = new Modal(targetEl, options);
    this.modalRoom = modal;
    this.modalRoom.show();
  }

  openModalCreateRoom() {
    const targetEl = document.getElementById("modal-room-create");
    const options = {
      modalPlacement: "bottom-right",
      modalBackdrop: "static",
      backdropClasses:
        "bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"
    };

    const modal = new Modal(targetEl, options);
    this.modalCreateRoom = modal;
    this.modalCreateRoom.show();
  }


  closeModal = () => this.modal.hide();

  closeModalCreate = () => this.modalCreate.hide();

  closeModalRoom = () => this.modalRoom.hide();

  closeModalCreateRoom = () => this.modalCreateRoom.hide();


  initializeFormWithHotelData() {
    if (this.currentHotel) {
      this.hotelForm.patchValue({
        name: this.currentHotel.name,
        description: this.currentHotel.description,
        stars: this.currentHotel.stars,
        address: this.currentHotel.address
      });
    }
  }


  initializeFormWithRoomData() {
    if (this.currentRoom) {
      this.roomForm.patchValue({
        sleepingPlaces: this.currentRoom.sleepingPlaces,
        quantity: this.currentRoom.quantity,
        price: this.currentRoom.price,
        roomTypeId: this.currentRoom.roomTypeId
      });
    }
  }

  getRoomTypeName(roomTypeId: string): string {
    const roomType = this.roomTypes.find(type => type.id === roomTypeId);
    return roomType ? roomType.name : 'Неизвестно';
  }

  getRoomTypeId(roomTypeName: string): string {
    const roomTypeId = this.roomTypes.find(type => type.name === roomTypeName);
    return roomTypeId ? roomTypeId.id : '';
  }
}
