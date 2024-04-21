import { Component } from '@angular/core';
import { User } from '../interfaces/user';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { environment } from '../../environments/environments';
import { UserService } from '../user.service';
import { Reservation } from '../interfaces/reservation';
import { AuthService } from '../auth.service';
import { Hotel } from '../interfaces/hotel';
import { Room } from '../interfaces/room';
import { Router } from '@angular/router';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
  user: User | undefined;
  reservations: Reservation[] = [];

  isAdmin: boolean | undefined = false;
  isHotelOwner: boolean | undefined = false;

  today = new Date();

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private httpClient: HttpClient,
    private router: Router,
    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
    this.userService.getUserFromToken()
      .subscribe(
        (user: User) => {
          this.user = user;
          this.isAdmin = this.user?.roles.includes('Admin') ? this.user?.roles.includes('Admin') : undefined;
          this.isHotelOwner = this.user?.roles.includes('HotelOwner') ? this.user?.roles.includes('HotelOwner') : undefined;
          setTimeout(() => {
            this.fetchReservations(user.id);
          }, 100);
        },
        (error) => {
          console.error('Error fetching user details:', error);
        }
      );
  }

  fetchReservations(userId: string) {
    const accessToken = this.authService.getAccessToken();
    if (!accessToken) return;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });
    const params = new HttpParams()
      .set('pageSize', 50)
      .set('orderBy', 'dateEntry desc');

    this.httpClient.get<Reservation[]>(`${environment.API_HOSTNAME}/users/${userId}/reservations`, { headers, params })
      .subscribe(
        (reservations: Reservation[]) => {
          this.reservations = reservations;
          console.log('Reservation details:', this.reservations);

          this.reservations.forEach(reservation => {
            this.fetchRoom(reservation.roomId)!
              .subscribe(
                (room: Room) => {
                  reservation.room = room;
                  console.log('Room details:', room);

                  this.fetchHotel(room.hotelId)!
                    .subscribe(
                      (hotel: Hotel) => {
                        reservation.hotel = hotel;
                        console.log('Hotel details:', hotel);
                      },
                      (error) => { console.error('Error fetching hotel details:', error); }
                    );
                },
                (error) => { console.error('Error fetching room details:', error); }
              );
          });
        },
        (error) => { console.error('Error fetching reservations details:', error); }
      );
  }

  fetchRoom(roomId: string) {
    const accessToken = this.authService.getAccessToken();
    if (!accessToken) return;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });
    return this.httpClient.get<Room>(`${environment.API_HOSTNAME}/rooms/${roomId}`, { headers });
  }

  fetchHotel(hotelId: string) {
    const accessToken = this.authService.getAccessToken();
    if (!accessToken) return;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });
    return this.httpClient.get<Hotel>(`${environment.API_HOSTNAME}/hotels/${hotelId}`, { headers });
  }

  deleteReservation(reservation: Reservation): void {
    const accessToken = this.authService.getAccessToken();
    if (!accessToken) return;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });

    const reservationUrl = `${environment.API_HOSTNAME}/rooms/${reservation.roomId}/reservations/${reservation.id}`;

    this.httpClient.delete<Reservation>(reservationUrl, { headers })
      .subscribe(
        (data: Reservation) => {
          console.log('deleted ' + reservation.id);
          this.notificationService.showSuccess('Вы отменили данное бронирование', 'Успех!');
          setTimeout(() => {
            window.location.reload();
          }, 500);
        },
        (error) => {
          console.error('Error deleting reservation:', error);
        }
      );
  }


  calculatePrice(reservation: Reservation): number {
    let totalPrice;

    const dateStart = reservation.dateEntry;
    const dateEnd = reservation.dateExit;

    let dateStartDate = null;
    let dateEndDate = null;

    if (dateStart && dateEnd) {
      dateStartDate = new Date(dateStart);
      dateEndDate = new Date(dateEnd);
    }
    reservation.room.totalPrice = reservation.room?.price;
    totalPrice = reservation.room?.totalPrice;

    if (dateStartDate! > dateEndDate!) {
      this.notificationService.showError('Дата заезда не может быть позже даты выезда', 'Ошибка!');
      return totalPrice;
    }

    const diffTime = Math.abs(dateEndDate!.getTime() - dateStartDate!.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    totalPrice = reservation.room?.price * diffDays;
    if (totalPrice === 0)
      totalPrice = reservation.room?.price;

    return totalPrice;
  }

  signOut() {
    this.authService.signOut();
  }


  dateToString(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  redirectToHome(): void {
    this.router.navigate(['/home']);
  }

  isNotOldDate(date: Date) {
    const today = new Date().setHours(0, 0, 0, 0);
    return new Date(date) >= new Date(today);
  }
}
