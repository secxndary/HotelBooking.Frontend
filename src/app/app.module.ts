import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { LightboxModule } from 'ngx-lightbox';
import { ToastrModule } from 'ngx-toastr';
import { SlickCarouselModule } from 'ngx-slick-carousel';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TopBarComponent } from './top-bar/top-bar.component';
import { AuthComponent } from './auth/auth.component';
import { SignupComponent } from './signup/signup.component';
import { HomeComponent } from './home/home.component';
import { SearchComponent } from './search/search.component';
import { HotelComponent } from './hotel/hotel.component';
import { ProfileComponent } from './profile/profile.component';
import { HotelOwnerComponent } from './hotel-owner/hotel-owner.component';
import { AdminComponent } from './admin/admin.component';
import { DatePipe } from '@angular/common';

@NgModule({
  declarations: [
    AppComponent,
    TopBarComponent,
    AuthComponent,
    SignupComponent,
    HomeComponent,
    SearchComponent,
    HotelComponent,
    ProfileComponent,
    HotelOwnerComponent,
    AdminComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    LightboxModule,
    SlickCarouselModule,
    ToastrModule.forRoot(),
    RouterModule.forRoot([
      { path: 'auth', component: AuthComponent },
      { path: 'signup', component: SignupComponent },
      { path: '', component: SearchComponent },
      { path: 'home', component: HomeComponent },
      { path: 'hotels/:hotelId', component: HotelComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'hotelOwner', component: HotelOwnerComponent },
      { path: 'admin', component: AdminComponent },
    ])
  ],
  providers: [DatePipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
