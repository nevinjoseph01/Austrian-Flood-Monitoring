import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="form-container">
      <h2>Email Verification</h2>
      <p>A verification code has been sent to your email. Please enter it below.</p>
      <form [formGroup]="verifyForm" (ngSubmit)="onSubmit()">
        <label>
          Email:
          <input formControlName="email" type="email" />
        </label>

        <label>
          Verification Code:
          <input formControlName="verificationCode" />
        </label>

        <button type="submit" [disabled]="verifyForm.invalid">Verify Email</button>
      </form>
      <div *ngIf="message" class="message">{{ message }}</div>
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

      p {
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

      .message {
        margin-top: 10px;
        color: #e74c3c;
        text-align: center;
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
    `,
  ],
})
export class VerifyEmailComponent {
  verifyForm: FormGroup;
  message: string = '';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    const emailFromState = this.router.getCurrentNavigation()?.extras.state?.['email'] || '';
    this.verifyForm = this.fb.group({
      email: [emailFromState, [Validators.required, Validators.email]],
      verificationCode: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.verifyForm.valid) {
      this.apiService.verifyEmail(this.verifyForm.value).subscribe(
        (response) => {
          // Navigate to login page
          this.router.navigate(['/login']);
        },
        (error) => {
          console.error('Verification error:', error);
          this.message = error.error.message || 'Verification failed';
        }
      );
    }
  }
}
