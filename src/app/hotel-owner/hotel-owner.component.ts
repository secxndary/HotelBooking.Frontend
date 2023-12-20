import { Component } from '@angular/core';
import { NotificationService } from '../notification.service';
import { AuthService } from '../auth.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Hotel } from '../interfaces/hotel';
import { environment } from '../../environments/environments';
import { User } from '../interfaces/user';
import { UserService } from '../user.service';

@Component({
  selector: 'app-hotel-owner',
  templateUrl: './hotel-owner.component.html',
  styleUrls: ['./hotel-owner.component.scss']
})
export class HotelOwnerComponent {
  hotels: Hotel[] = [];
  hotelOwner!: User;

  constructor(
    private httpClient: HttpClient,
    private authService: AuthService,
    private userService: UserService,
    private notificationService: NotificationService,
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
  }

  fetchHotelsByOwner() {
    const hotelsUrl = `${environment.API_HOSTNAME}/hotels/owner/${this.hotelOwner.id}`;
    const headers = this.authService.getAuthenticationHeader();
    const params = new HttpParams()
      .set('pageSize', 50)
      .set('orderBy', 'stars desc');

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
    console.log(`Update hotel with ID: ${hotelId}`);
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
}
