import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: 'verify-email.component.html',
  styleUrls: ['verify-email.component.css'],
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
