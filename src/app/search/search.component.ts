import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent {
  today: string = new Date().toISOString().split('T')[0];
  arrivalDate: string = this.getTodayPlusOne(this.today);
  departureDate: string = this.getTodayPlusTwo(this.today);
  sleepingPlaces: number = 2;
  searchForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.searchForm = this.formBuilder.group({
      arrivalDate: this.getTodayPlusOne(this.today),
      departureDate: this.getTodayPlusTwo(this.today),
      sleepingPlaces: [2]
    });
  }

  onSubmit(): void {
    const arrivalDate = this.searchForm.get('arrivalDate')?.value;
    const departureDate = this.searchForm.get('departureDate')?.value;
    const sleepingPlaces = this.sleepingPlaces;

    this.router.navigate(['/home'], {
      queryParams: {
        arrivalDate,
        departureDate,
        sleepingPlaces
      }
    });
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