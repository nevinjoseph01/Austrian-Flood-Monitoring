import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="form-container">
      <h2>Register</h2>
      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
        <label>
          Username:
          <input formControlName="username" />
        </label>
        <div class="error" *ngIf="registerForm.get('username')?.invalid && registerForm.get('username')?.touched">
          Username is required and must be at least 3 characters.
        </div>

        <label>
          Email:
          <input formControlName="email" type="email" />
        </label>
        <div class="error" *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
          Enter a valid email.
        </div>

        <label>
          Password:
          <input formControlName="password" type="password" />
        </label>
        <div class="error" *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
          Password is required and must be at least 6 characters.
        </div>

        <label>
          Role:
          <select formControlName="role">
            <option value="normal">Normal</option>
            <option value="special">Special</option>
            <option value="moderator">Moderator</option>
          </select>
        </label>

        <button type="submit" [disabled]="registerForm.invalid">Register</button>
      </form>
      <div *ngIf="message" class="message">{{ message }}</div>
      <p>Already have an account? <a routerLink="/login">Login here</a></p>
    </div>
  `,
  styles: [
    `
      .form-container {
        max-width: 500px;
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

      input,
      select {
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
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  message: string = '';

  constructor(private fb: FormBuilder, private apiService: ApiService, private router: Router) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['normal', Validators.required],
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
    if (this.registerForm.valid) {
      this.apiService.register(this.registerForm.value).subscribe(
        (response) => {
          // Navigate to email verification page
          this.router.navigate(['/verify-email'], { state: { email: this.registerForm.value.email } });
        },
        (error) => {
          console.error('Registration error:', error);
          this.message = error.error.message || 'Registration failed';
        }
      );
    }
  }
}
