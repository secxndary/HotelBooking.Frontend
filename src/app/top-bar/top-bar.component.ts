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

  user!: User;

  isAdmin: boolean | undefined = false;
  isHotelOwner: boolean | undefined = false;

  constructor(
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.userService.getUserFromToken()
      .subscribe(
        (user: User) => {
          this.user = user;
          this.isAdmin = this.user?.roles.includes('Admin') ? this.user?.roles.includes('Admin') : undefined;
          this.isHotelOwner = this.user?.roles.includes('HotelOwner') ? this.user?.roles.includes('HotelOwner') : undefined;
          
          console.log('USER: ',this.user);
          console.log('IS_ADMIN: ', this.isAdmin);
          console.log('IS_HOTEL_OWNER: ', this.isHotelOwner);
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
