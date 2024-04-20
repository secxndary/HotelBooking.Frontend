import { Component } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'HotelBooking';

  constructor(private router: Router) { }

  isAuthOrSignupOrNotActivatedRoute(): boolean {
    const route = this.router.routerState.snapshot.root;
    return this.isAuthRoute(route) || this.isSignupRoute(route) || this.isHotelOwnerAccountNotActivatedRoute(route) || this.isHotelOwnerAccountStillNotActivatedYetRoute(route);
  }

  isAuthRoute(route: ActivatedRouteSnapshot): boolean {
    if (route.firstChild)
      return this.isAuthRoute(route.firstChild);
    return route.routeConfig?.path === 'auth';
  }

  isSignupRoute(route: ActivatedRouteSnapshot): boolean {
    if (route.firstChild)
      return this.isSignupRoute(route.firstChild);
    return route.routeConfig?.path === 'signup';
  }

  isHotelOwnerAccountNotActivatedRoute(route: ActivatedRouteSnapshot): boolean {
    if (route.firstChild)
      return this.isSignupRoute(route.firstChild);
    return route.routeConfig?.path === 'hotel-owner-account-not-activated';
  }

  isHotelOwnerAccountStillNotActivatedYetRoute(route: ActivatedRouteSnapshot): boolean {
    if (route.firstChild)
      return this.isSignupRoute(route.firstChild);
    return route.routeConfig?.path === 'hotel-owner-account-still-not-activated-yet';
  }
}
