import { Component } from '@angular/core';
import { NotificationService } from '../notification.service';
import { AuthService } from '../auth.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Hotel } from '../interfaces/hotel';
import { environment } from '../../environments/environments';
import { User } from '../interfaces/user';
import { UserService } from '../user.service';
import { Modal } from 'flowbite';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-hotel-owner',
  templateUrl: './hotel-owner.component.html',
  styleUrls: ['./hotel-owner.component.scss']
})
export class HotelOwnerComponent {
  hotels: Hotel[] = [];
  hotelOwner!: User;

  hotelForm!: FormGroup;

  modal: any;
  currentHotel!: Hotel;

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
          console.log('USER: ', this.hotelOwner);
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
      stars: undefined
    });

    console.log('hotel form value', this.hotelForm.value)
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
        },
        (error) => { console.error('Error fetching hotel info:', error); }
      );
  }

  updateHotel(hotelId: string) {
    const hotelsUrl = `${environment.API_HOSTNAME}/hotels/${hotelId}`;
    const headers = this.authService.getAuthenticationHeader();

    const name = this.hotelForm.get('name')?.value;
    const description = this.hotelForm.get('description')?.value;
    const stars = this.hotelForm.get('stars')?.value
    const hotelOwnerId = this.hotelOwner?.id;

    const body = { name, description, stars, hotelOwnerId };

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

  closeModal() {
    this.modal.hide();
  }


  initializeFormWithHotelData() {
    if (this.currentHotel) {
      this.hotelForm.patchValue({
        name: this.currentHotel.name,
        description: this.currentHotel.description,
        stars: this.currentHotel.stars
      });
    }
  }
}
