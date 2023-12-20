import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../environments/environments';
import { AuthService } from './auth.service';
import { User } from './interfaces/user';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  user: User | undefined;

  isAdmin: boolean | undefined = false;
  isHotelOwner: boolean | undefined = false;

  constructor(
    private authService: AuthService,
    private httpClient: HttpClient
  ) { }

  ngOnInit() {
    this.isAdmin = this.user?.roles.includes('Admin') ? this.user?.roles.includes('Admin') : undefined;
    this.isHotelOwner = this.user?.roles.includes('HotelOwner') ? this.user?.roles.includes('HotelOwner') : undefined;
  }

  getUserFromToken(): Observable<User> {
    const accessToken = this.authService.getAccessToken();
    const refreshToken = this.authService.getRefreshToken();

    if (!accessToken || !refreshToken)
      throw new Error('Token not found');

    return this.httpClient.post<User>(`${environment.API_HOSTNAME}/token/getUser`, { accessToken, refreshToken });
  }
}
