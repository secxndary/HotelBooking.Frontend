import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';

import { AuthService } from '../auth.service';
import { NotificationService } from '../notification.service';
import { environment } from 'src/environments/environments';

import { Room } from '../interfaces/room';
import { RoomType } from '../interfaces/roomType';
import { Hotel } from '../interfaces/hotel';
import { RoomPhoto } from '../interfaces/roomPhoto';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  arrivalDate!: Date;
  departureDate!: Date;
  sleepingPlaces!: number;

  rooms: Room[] = [];
  hotels: Hotel[] = [];
  roomTypes: RoomType[] = [];

  groupedRooms: { [key: string]: Room[] } = {};
  roomImage!: string;

  filterForm!: FormGroup;
  hoveredStars: number = 0;
  starsFilter: number = 0;

  constructor(
    private httpClient: HttpClient,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.getQueryParams();
    this.fetchRooms();
    this.fetchRoomTypes();

    this.filterForm = this.formBuilder.group({
      minStars: 1,
      maxStars: 5,
      sleepingPlaces: this.sleepingPlaces ?? 2,
      roomType: '',
      sortName: '',
      sortDirection: '',
      searchTerm: ''
    });
  }

  fetchRooms(): void {
    const roomsUrl = `${environment.API_HOSTNAME}/rooms`;
    const accessToken = this.authService.getAccessToken();

    if (!accessToken)
      return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });

    const params = new HttpParams()
      .set('pageSize', 50)
      .set('minSleepingPlaces', this.sleepingPlaces)
      .set('maxSleepingPlaces', +this.sleepingPlaces + 2);

    this.httpClient.get<Room[]>(roomsUrl, { headers, params })
      .subscribe(
        (roomsData: Room[]) => {
          this.groupedRooms = this.groupRoomsByHotelId(roomsData);
          this.fetchHotelInfo(this.groupedRooms)
          Object.keys(this.groupedRooms).forEach(hotelId => {
            this.groupedRooms[hotelId].forEach(room => {
              setTimeout(() => {
                this.fetchRoomPhotoIds(room.id);
              }, 100);
            });
          });
        },
        (error) => {
          console.error('Error fetching rooms:', error);
        }
      );
  }

  fetchHotelInfo(groupedRooms: { [key: string]: Room[] }): void {
    const hotelsUrl = `${environment.API_HOSTNAME}/hotels`;
    const accessToken = this.authService.getAccessToken();

    if (!accessToken)
      return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });

    const params = new HttpParams()
      .set('pageSize', 50)
      .set('orderBy', 'stars desc');

    this.httpClient.get<Hotel[]>(hotelsUrl, { headers, params })
      .subscribe(
        (hotelDataArray: Hotel[]) => {
          this.hotels = hotelDataArray;
          this.hotels.forEach(hotel => {
            hotel.rooms = groupedRooms[hotel.id];
          });
        },
        (error) => {
          console.error('Error fetching hotel info:', error);
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

  fetchRoomPhotos(roomId: string, photoId: string): void {
    const roomPhotosUrl = `${environment.API_HOSTNAME}/rooms/${roomId}/photos/${photoId}/file`;
    const accessToken = this.authService.getAccessToken();

    if (!accessToken)
      return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });

    this.httpClient.get(roomPhotosUrl, { headers, responseType: 'blob' })
      .subscribe(
        (image: Blob) => {
          this.createImageFromBlob(image, roomId, photoId);
        },
        (error) => {
          console.error('Error fetching room photo:', error);
        }
      );
  }

  fetchRoomPhotoIds(roomId: string): void {
    const roomPhotosUrl = `${environment.API_HOSTNAME}/rooms/${roomId}/photos`;
    const accessToken = this.authService.getAccessToken();

    if (!accessToken)
      return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });

    this.httpClient.get<RoomPhoto[]>(roomPhotosUrl, { headers })
      .subscribe(
        (photos: RoomPhoto[]) => {
          const roomIndex = this.hotels.findIndex(hotel => hotel.rooms !== undefined && hotel.rooms.some(room => room.id === roomId));
          if (roomIndex !== -1) {
            const room = this.hotels[roomIndex].rooms.find(room => room.id === roomId);
            if (room) {
              room.roomPhotos = photos;
              room.roomPhotos.forEach(photo => {
                this.fetchRoomPhotos(roomId, photo.id);
              });
            }
          }
        },
        (error) => {
          console.error('Error fetching room photos:', error);
        }
      );
  }


  createImageFromBlob(image: Blob, roomId: string, photoId: string): void {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const imageUrl = reader.result as string;
      const hotelIndex = this.hotels.findIndex(hotel => hotel.rooms !== undefined && hotel.rooms.some(room => room.id === roomId));
      if (hotelIndex !== -1) {
        const roomIndex = this.hotels[hotelIndex].rooms.findIndex(room => room.id === roomId);
        if (roomIndex !== -1) {
          const photoIndex = this.hotels[hotelIndex].rooms[roomIndex].roomPhotos.findIndex(photo => photo.id === photoId);
          if (photoIndex !== -1) {
            this.hotels[hotelIndex].rooms[roomIndex].roomPhotos[photoIndex].imageUrl = imageUrl;
          }
        }
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

  getFirstRoomPhoto(room: Room): string | undefined {
    const filteredPhotos = room.roomPhotos.filter(photo => !photo.path.includes('bathroom'));
    const firstFilteredPhoto = filteredPhotos.length > 0
      ? filteredPhotos[0].imageUrl
      : undefined;
    return firstFilteredPhoto;
  }

  redirectToHotelPage(hotelId: string) {
    this.router.navigate([`hotels/${hotelId}`], {
      queryParams: {
        arrivalDate: this.arrivalDate,
        departureDate: this.departureDate,
        sleepingPlaces: this.sleepingPlaces
      }
    });
  }


  setStarsFilter(stars: number) {
    this.starsFilter = stars;
    console.log(`Выбрано ${stars} звезд(ы) для фильтрации`);
  }

  hoverStars(stars: number) {
    this.hoveredStars = stars;
    console.log(`Наведено на ${stars} звезд(ы)`);
  }


  fetchForFilter(search: boolean): void {
    const formValue = this.filterForm.value;

    const roomsUrl = `${environment.API_HOSTNAME}/rooms`;
    const accessToken = this.authService.getAccessToken();

    const minStars = this.filterForm.get('minStars')?.value;
    const maxStars = this.filterForm.get('maxStars')?.value;

    if (minStars > maxStars) {
      this.notificationService.showError('Минимальное значение не может быть больше максимального', '');
      return;
    }

    if (!accessToken)
      return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });

    const roomsParams = new HttpParams()
      .set('pageSize', '50')
      .set('minSleepingPlaces', formValue.sleepingPlaces)
      .set('maxSleepingPlaces', formValue.sleepingPlaces + 2);

    this.httpClient.get<Room[]>(roomsUrl, { headers, params: roomsParams })
      .subscribe(
        (roomsData: Room[]) => {
          const groupedRooms = this.groupRoomsByHotelId(roomsData);

          const hotelsUrl = `${environment.API_HOSTNAME}/hotels`;
          const hotelsParams = search
            ? new HttpParams()
              .set('pageSize', '50')
              .set('orderBy', `${formValue.sortName} ${formValue.sortDirection}`)
              .set('minStars', formValue.minStars)
              .set('maxStars', formValue.maxStars)
              .set('searchTerm', formValue.searchTerm)
            : new HttpParams()
              .set('pageSize', '50')
              .set('orderBy', `${formValue.sortName} ${formValue.sortDirection}`)
              .set('minStars', formValue.minStars)
              .set('maxStars', formValue.maxStars);

          this.httpClient.get<Hotel[]>(hotelsUrl, { headers, params: hotelsParams })
            .subscribe(
              (hotelDataArray: Hotel[]) => {
                this.hotels = hotelDataArray;
                this.hotels.forEach(hotel => {
                  hotel.rooms = groupedRooms[hotel.id];
                });
                Object.keys(this.groupedRooms).forEach(hotelId => {
                  this.groupedRooms[hotelId].forEach(room => {
                    this.fetchRoomPhotoIds(room.id);
                  });
                });
                console.log(this.hotels)

              },
              (error) => {
                console.error('Error fetching hotel info:', error);
              }
            );
        },
        (error) => {
          console.error('Error fetching rooms:', error);
        }
      );
  }

  onFilter(): void {
    this.fetchForFilter(false);
  }

  onSearch(): void {
    this.fetchForFilter(true);
  }


  private groupRoomsByHotelId(rooms: Room[]): { [key: string]: Room[] } {
    return rooms.reduce((acc, room) => {
      if (!acc[room.hotelId])
        acc[room.hotelId] = [];
      acc[room.hotelId].push(room);
      return acc;
    }, {} as { [key: string]: Room[] });
  }

  private getQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      this.arrivalDate = params['arrivalDate'];
      this.departureDate = params['departureDate'];
      this.sleepingPlaces = params['sleepingPlaces'];

      console.log('Arrival Date:', this.arrivalDate);
      console.log('Departure Date:', this.departureDate);
      console.log('Sleeping Places:', this.sleepingPlaces);
    });
  }
}