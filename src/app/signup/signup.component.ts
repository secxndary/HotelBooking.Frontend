import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { environment } from 'src/environments/environments';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {

  signUpForm!: FormGroup;
  errorMessages: { [key: string]: string } = {};

  constructor(
    private httpClient: HttpClient,
    private formBuilder: FormBuilder,
    private router: Router
  ) { }

  ngOnInit() {
    this.signUpForm = this.formBuilder.group({
      firstname: '',
      lastname: '',
      email: '',
      username: '',
      password: '',
      roles: [['user']],
      hotelOwner: [false]
    });

    this.signUpForm.get('hotelOwner')!
      .valueChanges
      .subscribe((value: boolean) => {
        const rolesControl = this.signUpForm.get('roles');
        value ? rolesControl!.setValue(['hotelOwner']) : rolesControl!.setValue(['user']);
      });
  }

  onSubmit(): void {
    const apiUrl = `${environment.API_HOSTNAME}/authentication`;

    this.httpClient
      .post(apiUrl, this.signUpForm.value)
      .subscribe(
        (response: any) => {
          console.log(this.signUpForm.value);
          this.signUpForm.reset();
          this.errorMessages = {};
          this.router.navigate(['/auth']);
        },
        (error) => {
          if (error.status === 422 && error.error) {
            this.errorMessages = error.error;
          }
          else if (error.status === 400 && error.error) {
            this.errorMessages = this.concatenateErrorMessages(error.error);
          }
          else {
            this.errorMessages = {};
            console.error('Error occurred:', error);
          }

          console.log('ERROR MESSAGES');
          console.log(this.errorMessages);
          console.log('\n')
        });
  }

  private concatenateErrorMessages(error: any): { [key: string]: string } {
    const concatenatedErrors: { [key: string]: string } = {};

    Object.keys(error).forEach((key) => {
      if (key.includes('Password')) {
        const messages = error[key].join('<br/>');
        concatenatedErrors['Password'] = concatenatedErrors['Password'] ? concatenatedErrors['Password'] + `<br />${messages}` : messages;
      }
      if (key.includes('UserName')) {
        const messages = error[key].join('<br/>');
        concatenatedErrors['UserName'] = concatenatedErrors['UserName'] ? concatenatedErrors['UserName'] + `<br />${messages}` : messages;
      }
      if (key.includes('Email')) {
        const messages = error[key].join('<br/>');
        concatenatedErrors['Email'] = concatenatedErrors['Email'] ? concatenatedErrors['Email'] + `<br />${messages}` : messages;
      }
    });

    console.log('CONCETRATED ERRORS')
    console.log(concatenatedErrors);
    console.log('\n')

    return concatenatedErrors;
  }

}
