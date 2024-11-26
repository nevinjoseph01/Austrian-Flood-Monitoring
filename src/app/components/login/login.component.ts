import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="form-container">
      <h2>Login</h2>
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <label>
          Username:
          <input formControlName="username" />
        </label>
        <div class="error" *ngIf="loginForm.get('username')?.invalid && loginForm.get('username')?.touched">
          Username is required.
        </div>

        <label>
          Password:
          <input formControlName="password" type="password" />
        </label>
        <div class="error" *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
          Password is required.
        </div>

        <button type="submit" [disabled]="loginForm.invalid">Login</button>
      </form>
      <div *ngIf="message" class="message">{{ message }}</div>
      <p>Don't have an account? <a routerLink="/register">Register here</a></p>
    </div>
  `,
  styles: [
    `
      .form-container {
        max-width: 400px;
        margin: 50px auto;
        padding: 20px;
        background-color: #1a1a1a;
        border-radius: 10px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #f1c40f;
      }

      h2 {
        text-align: center;
      }

      label {
        display: block;
        margin-bottom: 10px;
      }

      input {
        width: 100%;
        padding: 8px;
        border: 1px solid #333;
        border-radius: 5px;
        background-color: #333;
        color: #f1c40f;
        font-size: 1em;
      }

      .error {
        color: #e74c3c;
        font-size: 0.9em;
        margin-bottom: 10px;
      }

      .message {
        margin-top: 10px;
        color: #e74c3c;
      }

      button {
        width: 100%;
        padding: 10px;
        background-color: #f1c40f;
        color: #1a1a1a;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 1em;
      }

      button:disabled {
        background-color: #7f8c8d;
        cursor: not-allowed;
      }

      p {
        text-align: center;
        margin-top: 20px;
      }

      a {
        color: #f1c40f;
        text-decoration: none;
      }

      a:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  message: string = '';

  constructor(private fb: FormBuilder, private apiService: ApiService, private router: Router) {
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
      this.apiService.login(this.loginForm.value).subscribe(
        (response) => {
          // Store user credentials
          this.apiService.storeUserCredentials(response.user.id, response.user.role, response.user.username);
          // Navigate to the welcome page
          this.router.navigate(['/welcome', response.user.username]);
        },
        (error) => {
          console.error('Login error:', error);
          this.message = error.error.message || 'Login failed';
        }
      );
    }
  }
}
