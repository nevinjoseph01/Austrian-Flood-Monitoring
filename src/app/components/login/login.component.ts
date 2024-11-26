import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SpinnerComponent],
  templateUrl: 'login.component.html',
  styleUrls: ['login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  message: string = '';
  isLoading: boolean = false; // Loading state

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  ngOnInit() {
    if (this.apiService.getUserId()) {
      // User is already logged in, redirect to welcome page
      const username = this.apiService.getUsername();
      this.router.navigate(['/welcome', username]);
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true; // Start loading
      this.apiService.login(this.loginForm.value).subscribe(
        (response) => {
          // Store user credentials
          this.apiService.storeUserCredentials(response.user.id, response.user.role, response.user.username);
          this.isLoading = false; // Stop loading
          // Navigate to the welcome page
          this.router.navigate(['/welcome', response.user.username]);
        },
        (error) => {
          console.error('Login error:', error);
          this.message = error.error.message || 'Login failed';
          this.isLoading = false; // Stop loading
        }
      );
    }
  }
}
