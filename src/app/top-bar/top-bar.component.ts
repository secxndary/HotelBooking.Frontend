import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { User } from '../interfaces/user';
import { UserService } from '../user.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss']
})
export class TopBarComponent {
  isAdmin: boolean = false;
  isHotelOwner: boolean = false;

  user!: User;

  constructor(
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.userService.getUserFromToken()
      .subscribe(
        (user: User) => {
          console.log(user);
          this.user = user;
        },
        (error) => {
          console.error('Error fetching user details:', error);
          if (error.status === 500) {
            this.authService.refreshTokens();
          }
          this.authService.navigateToAuth();
        }
      );
  }

  onProfile(): void {
    this.router.navigate(['/profile']);
  }

  onSearch(): void {
    this.router.navigate(['/']);
  }
}
