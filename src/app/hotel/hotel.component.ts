import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Hotel } from '../interfaces/hotel';
import { Room } from '../interfaces/room';
import { HotelPhoto } from '../interfaces/hotelPhoto';
import { AuthService } from '../auth.service';
import { environment } from 'src/environments/environments';
import { slideConfig, slideConfigStatic } from '../../assets/slide-config';
import { RoomPhoto } from '../interfaces/roomPhoto';
import { RoomType } from '../interfaces/roomType';
import { UserService } from '../user.service';
import { User } from '../interfaces/user';
import { Reservation } from '../interfaces/reservation';
import { NotificationService } from '../notification.service';
import { Modal } from 'flowbite';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-hotel',
  templateUrl: './hotel.component.html',
  styleUrls: ['./hotel.component.scss']
})
export class HotelComponent implements OnInit {
  hotelId!: string;
  hotel: Hotel | undefined;
  rooms: Room[] = [];
  hotelPhotos: HotelPhoto[] = [];
  roomTypes: RoomType[] = [];

  user: User | undefined;
  accessToken: string | undefined;

  slideConfig = slideConfig;
  slideConfigStatic = slideConfigStatic;

  modal: any;
  reservationForm!: FormGroup;

  totalPrice!: number;
  currentRoom!: Room;

  constructor(
    private route: ActivatedRoute,
    private httpClient: HttpClient,
    private authService: AuthService,
    private userService: UserService,
    private notificationService: NotificationService,
    private formBuilder: FormBuilder,
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.hotelId = params['hotelId'];
      this.fetchHotelPhotos(this.hotelId);
      this.fetchRoomPhotos();
      this.fetchRoomTypes();
      this.fetchRooms();
      this.fetchHotel(this.hotelId);
    });

    this.userService.getUserFromToken()
      .subscribe(
        (user: User) => {
          this.user = user;
          console.log('User:', user);
        },
        (error) => {
          console.error('Error fetching user details:', error);
        }
      );

    this.reservationForm = this.formBuilder.group({
      dateStart: undefined,
      dateEnd: undefined,
    });
  }

  fetchHotel(hotelId: string) {
    const accessToken = this.authService.getAccessToken();
    if (!accessToken)
      return;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });

    this.httpClient.get<Hotel>(`${environment.API_HOSTNAME}/hotels/${hotelId}`, { headers })
      .subscribe(
        (hotel: Hotel) => {
          this.hotel = hotel;
          console.log('Hotel details:', this.hotel);
        },
        (error) => {
          console.error('Error fetching hotel details:', error);
        }
      );
  }

  fetchHotelPhotos(hotelId: string) {
    const accessToken = this.authService.getAccessToken();
    if (!accessToken)
      return;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });
    this.accessToken = accessToken;
    console.log(`accessToken: ${accessToken}`);
    console.log(`this.accessToken: ${this.accessToken}`);

    this.httpClient.get<HotelPhoto[]>(`${environment.API_HOSTNAME}/hotels/${hotelId}/photos`, { headers })
      .subscribe(
        (photos: HotelPhoto[]) => {
          this.hotelPhotos = photos;
          this.loadHotelPhotos(hotelId);
        },
        (error) => {
          console.error('Error fetching hotel photos:', error);
        }
      );
  }

  loadHotelPhotos(hotelId: string) {
    const accessToken = this.authService.getAccessToken();
    if (!accessToken)
      return;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });

    this.hotelPhotos.forEach((photo: HotelPhoto) => {
      this.httpClient.get(`${environment.API_HOSTNAME}/hotels/${hotelId}/photos/${photo.id}/file`, { responseType: 'blob', headers }).subscribe(
        (image: Blob) => {
          if (image) {
            const imageUrl = URL.createObjectURL(image);
            photo.imageUrl = imageUrl;
          }
        },
        (error) => {
          console.error(`Error fetching hotel photo ${photo.id}:`, error);
        }
      );
    });
  }


  fetchRooms(): void {
    const accessToken = this.authService.getAccessToken();
    if (!accessToken)
      return;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });

    this.httpClient.get<Room[]>(`${environment.API_HOSTNAME}/hotels/${this.hotelId}/rooms`, { headers })
      .subscribe(
        (rooms: Room[]) => {
          this.hotel!.rooms = rooms;
          console.log('Hotel rooms:', this.hotel!.rooms);
          this.fetchRoomPhotos();
        },
        (error) => {
          console.error('Error fetching hotel rooms:', error);
        }
      );
  }

  fetchRoomImages(room: Room): Promise<void[]> {
    const accessToken = this.authService.getAccessToken();
    if (!accessToken)
      return Promise.resolve([]);
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });

    const promises: Promise<void>[] = room.roomPhotos.map((photo: RoomPhoto) => {
      return new Promise<void>((resolve, reject) => {
        this.httpClient.get(`${environment.API_HOSTNAME}/rooms/${room.id}/photos/${photo.id}/file`, { responseType: 'blob', headers })
          .subscribe(
            (image: Blob) => {
              const reader = new FileReader();
              reader.addEventListener('load', () => {
                const imageUrl = reader.result as string;
                if (!imageUrl) {
                  reject(`Failed to load image for Room ${room.id} photo ${photo.id}`);
                  return;
                }
                photo.imageUrl = imageUrl;
                console.log(`Room ${room.id} photo ${photo.id}`);
                resolve();
              }, false);

              image
                ? reader.readAsDataURL(image)
                : reject(`No image for Room ${room.id} photo ${photo.id}`);
            },
            (error) => {
              console.error(`Error fetching room ${room.id} photo ${photo.id}:`, error);
              reject(error);
            }
          );
      });
    });

    return Promise.all(promises);
  }

  fetchRoomPhotos(): void {
    const accessToken = this.authService.getAccessToken();
    if (!accessToken) return;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });

    this.httpClient.get<Room[]>(`${environment.API_HOSTNAME}/hotels/${this.hotelId}/rooms`, { headers })
      .subscribe(
        (rooms: Room[]) => {
          this.hotel!.rooms = rooms;
          console.log('Hotel rooms:', this.hotel!.rooms);

          const promises: Promise<void>[] = this.hotel!.rooms.map((room: Room) => {
            return new Promise<void>((resolve, reject) => {
              this.httpClient.get<RoomPhoto[]>(`${environment.API_HOSTNAME}/rooms/${room.id}/photos`, { headers })
                .subscribe(
                  (photos: RoomPhoto[]) => {
                    room.roomPhotos = photos;
                    console.log(`Room ${room.id} photos:`, room.roomPhotos);

                    this.fetchRoomImages(room)
                      .then(() => { resolve(); })
                      .catch((error) => { reject(error); });
                  },
                  (error) => {
                    console.error(`Error fetching room ${room.id} photos:`, error);
                    reject(error);
                  }
                );
            });
          });

          Promise.all(promises)
            .then(() => { console.log('All images loaded'); })
            .catch((error) => { console.error('Error loading images:', error); });
        },
        (error) => {
          console.error('Error fetching hotel rooms:', error);
        }
      );
  }

  fetchRoomTypes(): void {
    const roomTypesUrl = `${environment.API_HOSTNAME}/roomTypes`;

    const accessToken = this.authService.getAccessToken();
    if (!accessToken)
      return;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });

    console.log(headers);

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

  openModal(room: Room): void {
    this.totalPrice = room.price;
    this.currentRoom = room;

    const targetEl = document.getElementById("modalEl");

    const options = {
      modalPlacement: "bottom-right",
      modalBackdrop: "dynamic",
      backdropClasses:
        "bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40",
      onHide: () => {
        console.log("modal is hidden");
      },
      onShow: () => {
        console.log("modal is shown");
      },
      onToggle: () => {
        console.log("modal has been toggled");
      },
    };

    const modal = new Modal(targetEl, options);
    this.modal = modal;
    this.modal.show();
  }

  closeModal() {
    this.modal.hide();
  }

  reserveRoom(room: Room): void {
    const reservationUrl = `${environment.API_HOSTNAME}/rooms/${room.id}/reservations`;

    const accessToken = this.accessToken;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });

    const dateEntry = this.reservationForm.get('dateStart')?.value;
    const dateExit = this.reservationForm.get('dateEnd')?.value;

    const body = {
      dateEntry: dateEntry,
      dateExit: dateExit,
      userId: this.user?.id
    }

    if (!dateEntry && !dateExit) {
      this.notificationService.showError('Введите даты заезда и выезда', 'Ошибка!');
      return;
    }

    if (dateEntry > dateExit) {
      this.notificationService.showError('Дата заезда не может быть позже даты выезда', 'Ошибка!');
      return;
    }

    this.httpClient.post<Reservation>(reservationUrl, body, { headers })
      .subscribe(
        (reservation: Reservation) => {
          console.log(reservation);
          if (reservation !== null || reservation !== undefined)
            this.notificationService.showSuccess('Бронирование успешно', 'Успех!');
          this.closeModal();
        },
        (error) => {
          console.error('Error fetching room types:', error);
          if (error.status === 403)
            this.notificationService.showError('У вас нет прав для выполнения этого действия', 'Ошибка!');
          else
            this.notificationService.showError('Введите даты заезда и выезда', 'Ошибка!');
        }
      );
  }


  calculatePrice(roomie: Room): number {
    const roomReal = this.hotel!.rooms.find(x => x.id == this.currentRoom?.id);

    console.log('CURRENT_ROOM', this.currentRoom)
    console.log('HOTEL ROOMS', this.hotel!.rooms)
    console.log('CURRENT_ROOM_ID', this.currentRoom?.id)
    console.log('ROOM REAL', roomReal)

    const dateStart = this.reservationForm.get('dateStart')?.value;
    const dateEnd = this.reservationForm.get('dateEnd')?.value;

    let dateStartDate = null;
    let dateEndDate = null;

    if (dateStart && dateEnd) {
      dateStartDate = new Date(dateStart);
      dateEndDate = new Date(dateEnd);
    }
    this.totalPrice = roomReal!.price;

    console.log('\n');
    console.log('ROOM', roomReal)
    console.log('START', dateStart)
    console.log('END', dateEnd);
    console.log('START_DATE', dateStartDate)
    console.log('END_DATE', dateEndDate);
    console.log('TOTAL', this.totalPrice)
    console.log('\n');

    if (dateStartDate! > dateEndDate!) {
      this.notificationService.showError('Дата заезда не может быть позже даты выезда', 'Ошибка!');
      return this.totalPrice;
    }

    const diffTime = Math.abs(dateEndDate!.getTime() - dateStartDate!.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    this.totalPrice = roomReal!.price * diffDays;
    if (this.totalPrice === 0)
      this.totalPrice = roomReal!.price;

    console.log('TOTAL_AFTER', this.totalPrice)
    return this.totalPrice;
  }

  createImageFromBlob(image: Blob, room: Room, photo: RoomPhoto): void {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const imageUrl = reader.result as string;
      if (imageUrl) {
        photo.imageUrl = imageUrl;
        console.log(`Room ${room.id} photo ${photo.id}`);
      }
    }, false);

    if (image) {
      reader.readAsDataURL(image);
    }
  }


  getRoomTypeName(roomTypeId: string): string {
    const roomType = this.roomTypes.find(type => type.id === roomTypeId);
    return roomType ? roomType.name : 'Неизвестно';
  }
}
