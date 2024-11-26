import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: 'register.component.html',
  styleUrls: [ 'register.component.css' ],
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
