import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environments';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent {
  cities!: string[];
  today: string = new Date().toISOString().split('T')[0];
  arrivalDate: string = this.getTodayPlusOne(this.today);
  departureDate: string = this.getTodayPlusTwo(this.today);
  sleepingPlaces: number = 2;
  searchForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private httpClient: HttpClient
  ) { }

  ngOnInit(): void {
    this.fetchCities();

    this.searchForm = this.formBuilder.group({
      city: '',
      arrivalDate: this.getTodayPlusOne(this.today),
      departureDate: this.getTodayPlusTwo(this.today),
      sleepingPlaces: [2]
    });
  }

  onSubmit(): void {
    const city = this.searchForm.get('city')?.value;
    const arrivalDate = this.searchForm.get('arrivalDate')?.value;
    const departureDate = this.searchForm.get('departureDate')?.value;
    const sleepingPlaces = this.sleepingPlaces;

    this.router.navigate(['/home'], {
      queryParams: {
        city,
        arrivalDate,
        departureDate,
        sleepingPlaces
      }
    });
  }

  fetchCities() {
    const accessToken = this.authService.getAccessToken();
    if (!accessToken)
      return;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });

    this.httpClient.get<string[]>(`${environment.API_HOSTNAME}/hotels/addresses`, { headers })
      .subscribe(
        (cities: string[]) => {
          this.cities = cities;
          console.log('Cities:', cities);
        },
        (error) => {
          console.error('Error fetching cities details:', error);
        }
      );
  }

  getTodayPlusOne(date: string): string {
    const today = new Date(date);
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  }

  getTodayPlusTwo(date: string): string {
    const today = new Date(date);
    today.setDate(today.getDate() + 2);
    return today.toISOString().split('T')[0];
  }

  incrementSleepingPlaces(): void {
    if (this.sleepingPlaces < 16)
      this.sleepingPlaces++;
  }

  decrementSleepingPlaces(): void {
    if (this.sleepingPlaces > 1)
      this.sleepingPlaces--;
  }
}