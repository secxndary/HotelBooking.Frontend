import { Component } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'HotelBooking';

  constructor(private router: Router) {}

  isAuthOrSignupRoute(): boolean {
    const route = this.router.routerState.snapshot.root;
    return this.isAuthRoute(route) || this.isSignupRoute(route);
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
}
