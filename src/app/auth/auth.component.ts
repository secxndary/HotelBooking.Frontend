import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, Validators } from '@angular/forms';

import { AuthService } from '../auth.service';
import { environment } from 'src/environments/environments';
import { Router } from '@angular/router';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {

  signInForm = this.formBuilder.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });
  errorMessages: { [key: string]: string[] } = {};
  authError: boolean = false;

  constructor(
    private httpClient: HttpClient,
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private route: Router,
    private notificationService: NotificationService,
  ) { }

  onSubmit(): void {
    const apiUrl = `${environment.API_HOSTNAME}/authentication/login`;

    this.httpClient
      .post(apiUrl, this.signInForm.value)
      .subscribe(
        (response: any) => {
          const accessToken = response.accessToken;
          const refreshToken = response.refreshToken;

          console.log('Auth component ts')
          console.log('Access Token:', accessToken);
          console.log('Refresh Token:', refreshToken);
          console.log('\n');

          this.authService.setTokens(accessToken, refreshToken);
          this.signInForm.reset();
          this.route.navigate(['/']);
          this.notificationService.showSuccess(`Добро пожаловать в StaySpot!`, '');
        },
        (error) => {
          if (error.status === 422 && error.error) {
            this.errorMessages = {};
            this.errorMessages = error.error;
          }
          else if (error.status === 401 && error.error) {
            this.notificationService.showError('Неверный пароль или имя пользователя', 'Ошибка!');
            // this.authError = true;
          }
          else {
            this.errorMessages = {};
            console.error('Error occurred:', error);
          }
        });
  }
}
