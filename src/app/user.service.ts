import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';

import { environment } from '../environments/environments';
import { User } from './interfaces/user';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  user: User | undefined;

  constructor(
    private authService: AuthService,
    private httpClient: HttpClient
  ) { }

  getUserFromToken(): Observable<User> {
    const accessToken = this.authService.getAccessToken();
    const refreshToken = this.authService.getRefreshToken();

    if (!accessToken || !refreshToken) 
      throw new Error('Token not found');

    return this.httpClient.post<User>(`${environment.API_HOSTNAME}/token/getUser`, { accessToken, refreshToken });
  }
}
