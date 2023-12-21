import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';
import { environment } from '../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  accessToken!: string;
  refreshToken!: string;

  constructor(
    private route: Router,
    private notificationService: NotificationService,
    private httpClient: HttpClient,
  ) { }

  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  getAccessToken(): string | null {
    const accessToken = localStorage.getItem('accessToken');
    // console.log('[AUTH SERVICE] Access token', accessToken);
    return accessToken;
  }

  getRefreshToken(): string | null {
    const refreshToken = localStorage.getItem('refreshToken');
    // console.log('[AUTH SERVICE] Refresh token', refreshToken);
    return refreshToken;
  }

  getAuthenticationHeader(): HttpHeaders {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      this.navigateToAuth();
      return new HttpHeaders();
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });
    return headers;
  }

  refreshTokens() {
    const tokensUrl = `${environment.API_HOSTNAME}/token/refresh`;

    const body = {
      "accessToken": this.getAccessToken(),
      "refreshToken": this.getRefreshToken()
    }
    this.httpClient.post(tokensUrl, body)
      .subscribe(
        (res: any) => {
          console.log(res);
        },
        (error) => {
          console.error('Error refreshing tokens:', error);
        }
      );
  }

  signOut() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.notificationService.showSuccess('Вы вышли из системы', '');
    this.route.navigate(['/auth']);
  }

  navigateToAuth() {
    this.notificationService.showError('Время пребывания в аккаунте истекло', 'Внимание!');
    this.route.navigate(['/auth']);
  }
}
