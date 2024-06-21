import { Component } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {
  roomTypes: RoomType[] = [];
  hotels: Hotel[] = [];
  hotelOwner!: User;
  currentHotel!: Hotel;
  currentRoomType!: RoomType;
  hotelOwnersNotActivated: User[] = [];

  hotelForm!: FormGroup;
  hotelFormCreate!: FormGroup;
  roomTypeFormCreate!: FormGroup;
  roomTypeFormEdit!: FormGroup;

  modal: any;
  modalCreate: any;
  modalCreateRoomType: any;
  modalEditRoomType: any;

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
          this.fetchHotelOwnersNotActivated();
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

    this.roomTypeFormCreate = this.formBuilder.group({
      name: undefined,
      description: undefined
    });

    this.roomTypeFormEdit = this.formBuilder.group({
      name: undefined,
      description: undefined
    });
  }

  fetchHotelsByOwner() {
    const hotelsUrl = `${environment.API_HOSTNAME}/hotels`;
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
            this.fetchHotelOwners(hotel);
          });
        },
        (error) => { console.error('Error fetching hotel info:', error); }
      );
  }

  fetchRoomsForHotel(hotel: Hotel): Room[] | void {
    const roomsUrl = `${environment.API_HOSTNAME}/hotels/${hotel?.id}/rooms`;
    const headers = this.authService.getAuthenticationHeader();

    this.httpClient.get<Room[]>(roomsUrl, { headers })
      .subscribe(
        (rooms: Room[]) => {
          hotel.rooms = rooms;
          console.log('rooms', rooms);
          console.log('hotel.rooms', hotel.rooms)
        },
        (error) => { console.error('Error fetching room info:', error); }
      );
  }

  fetchHotelOwners(hotel: Hotel) {
    const usersUrl = `${environment.API_HOSTNAME}/token/user-by-id/${hotel.hotelOwnerId}`;
    const headers = this.authService.getAuthenticationHeader();

    this.httpClient.get<User>(usersUrl, { headers })
      .subscribe(
        (user: User) => {
          hotel.hotelOwner = user;
          console.log(hotel.hotelOwner);
        },
        (error) => { console.error('Error fetching user info:', error); }
      );
  }

  fetchHotelOwnersNotActivated() {
    const usersUrl = `${environment.API_HOSTNAME}/token/hotel-owners-not-activated`;
    const headers = this.authService.getAuthenticationHeader();

    this.httpClient.get<User[]>(usersUrl, { headers })
      .subscribe(
        (hotelOwners: User[]) => {
          this.hotelOwnersNotActivated = hotelOwners;
          console.warn(hotelOwners);
        },
        (error) => { console.error('Error fetching hotelOwners info:', error); }
      );
  }

  fetchRoomTypes() {
    const roomTypesUrl = `${environment.API_HOSTNAME}/roomTypes`;
    const headers = this.authService.getAuthenticationHeader();

    this.httpClient.get<RoomType[]>(roomTypesUrl, { headers })
      .subscribe(
        (roomTypes: RoomType[]) => {
          this.roomTypes = roomTypes;
        },
        (error) => { console.error('Error fetching roomType info:', error); }
      );
  }

  confirmRegistration(hotelOwner: User) {
    const usersUrl = `${environment.API_HOSTNAME}/token/activate-account/${hotelOwner.id}`;
    const headers = this.authService.getAuthenticationHeader();

    this.httpClient.get(usersUrl, { headers })
      .subscribe(
        (response: any) => {
          console.warn('confirmed')
          this.notificationService.showSuccess('Аккаунт менеджера подтверждён!', 'Успех')

          setTimeout(() => {
            window.location.reload();
          }, 500);
        },
        (error) => { console.error('Error fetching hotelOwners info:', error); }
      );
  }

  dontConfirmRegistration(hotelOwner: User) {
    const usersUrl = `${environment.API_HOSTNAME}/token/decline-account/${hotelOwner.id}`;
    const headers = this.authService.getAuthenticationHeader();

    this.httpClient.get(usersUrl, { headers })
      .subscribe(
        (response: any) => {
          console.warn('not confirmed')
          this.notificationService.showSuccess('Менеджеру отказано в регистрации.', 'Успех')

          setTimeout(() => {
            window.location.reload();
          }, 500);
        },
        (error) => { console.error('Error fetching hotelOwners info:', error); }
      );
  }


  createHotel() {
    const hotelsUrl = `${environment.API_HOSTNAME}/hotels`;
    const headers = this.authService.getAuthenticationHeader();

    const name = this.hotelFormCreate.get('name')?.value;
    const description = this.hotelFormCreate.get('description')?.value;
    const address = this.hotelFormCreate.get('address')?.value;
    const stars = this.hotelFormCreate.get('stars')?.value
    const hotelOwnerId = this.hotelOwner?.id;

    const body = { name, description, stars, address, hotelOwnerId };

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
    const address = this.hotelForm.get('address')?.value;
    const stars = this.hotelForm.get('stars')?.value
    const hotelOwnerId = this.hotelOwner?.id;

    const body = { name, description, stars, address, hotelOwnerId };

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

  createRoomType() {
    const roomTypesUrl = `${environment.API_HOSTNAME}/roomTypes`;
    const headers = this.authService.getAuthenticationHeader();

    const name = this.roomTypeFormCreate.get('name')?.value;
    const description = this.roomTypeFormCreate.get('description')?.value;

    const body = { name, description };

    this.httpClient.post(roomTypesUrl, body, { headers })
      .subscribe(
        (res) => {
          this.notificationService.showSuccess('Тип номера создан!', '');
          this.closeModalCreateRoomType();
          setTimeout(() => {
            window.location.reload();
          }, 500);
        },
        (error) => {
          console.error('Error fetching roomType info:', error);
          if (error.status === 422)
            this.notificationService.showError(`${error.error.Stars[0]}`, 'Ошибка!');
          else
            this.notificationService.showError('Не удалось создать тип номера', 'Ошибка!');
        }
      );
  }

  updateRoomType(roomTypeId: string) {
    const roomTypesUrl = `${environment.API_HOSTNAME}/roomTypes/${roomTypeId}`;
    const headers = this.authService.getAuthenticationHeader();

    const name = this.roomTypeFormEdit.get('name')?.value;
    const description = this.roomTypeFormEdit.get('description')?.value;

    const body = { name, description };

    this.httpClient.put(roomTypesUrl, body, { headers })
      .subscribe(
        (res) => {
          this.notificationService.showSuccess('Тип номера успешно обновлён!', '');
          console.log(`Update roomType with ID: ${roomTypeId}`);
          this.closeModalEditRoomType();
          setTimeout(() => {
            window.location.reload();
          }, 300);
        },
        (error) => {
          console.error('Error fetching roomType info:', error);
          if (error.status === 422)
            this.notificationService.showError(`${error.error.Stars[0]}`, 'Ошибка!');
          else
            this.notificationService.showError('Тип комнаты не удалось обновить', 'Ошибка!');
        }
      );
  }

  deleteRoomType(roomTypeId: string) {
    const roomTypesUrl = `${environment.API_HOSTNAME}/roomTypes/${roomTypeId}`;
    const headers = this.authService.getAuthenticationHeader();

    this.httpClient.delete(roomTypesUrl, { headers })
      .subscribe(
        (res) => {
          console.log(`Delete roomType with ID: ${roomTypeId}`);
          this.notificationService.showSuccess('Тип номера успешно удалён', '');
          setTimeout(() => {
            window.location.reload();
          }, 500);
        },
        (error) => {
          console.error('Error fetching roomType info:', error);
          this.notificationService.showError('Тип номера не получилось удалить', 'Ошибка!');
        }
      );
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

  openModalCreateRoomType() {
    const targetEl = document.getElementById("create-modal-roomType");
    const options = {
      modalPlacement: "bottom-right",
      modalBackdrop: "static",
      backdropClasses:
        "bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"
    };

    const modal = new Modal(targetEl, options);
    this.modalCreateRoomType = modal;
    this.modalCreateRoomType.show();
  }

  openModalEditRoomType(roomType: RoomType) {
    const targetEl = document.getElementById("modalElRoomType");
    const options = {
      modalPlacement: "bottom-right",
      modalBackdrop: "static",
      backdropClasses:
        "bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"
    };

    this.currentRoomType = roomType;
    this.initializeFormWithRoomTypeData();

    const modal = new Modal(targetEl, options);
    this.modalEditRoomType = modal;
    this.modalEditRoomType.show();
  }


  closeModal = () => this.modal.hide();

  closeModalCreate = () => this.modalCreate.hide();

  closeModalCreateRoomType = () => this.modalCreateRoomType.hide();

  closeModalEditRoomType = () => this.modalEditRoomType.hide();


  initializeFormWithHotelData() {
    if (this.currentHotel) {
      this.hotelForm.patchValue({
        name: this.currentHotel.name,
        description: this.currentHotel.description,
        address: this.currentHotel.address,
        stars: this.currentHotel.stars
      });
    }
  }

  initializeFormWithRoomTypeData() {
    if (this.currentRoomType) {
      this.roomTypeFormEdit.patchValue({
        name: this.currentRoomType.name,
        description: this.currentRoomType.description,
      });
    }
  }
}
