import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="form-container">
      <h2>Create a Report</h2>
      <form [formGroup]="reportForm" (ngSubmit)="onSubmit()">
        <label>
          Title:
          <input formControlName="title" />
        </label>
        <div class="error" *ngIf="reportForm.get('title')?.invalid && reportForm.get('title')?.touched">
          Title is required.
        </div>

        <label>
          Description:
          <textarea formControlName="description"></textarea>
        </label>

        <button type="submit" [disabled]="reportForm.invalid">Submit Report</button>
      </form>
      <div *ngIf="message" class="message">{{ message }}</div>
    </div>
  `,
  styles: [
    `
      .form-container {
        max-width: 600px;
        margin: 50px auto;
        padding: 20px;
        background-color: #1a1a1a;
        border-radius: 10px;
        color: #f1c40f;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      h2 {
        text-align: center;
      }

      label {
        display: block;
        margin-bottom: 10px;
      }

      input,
      textarea {
        width: 100%;
        padding: 8px;
        border: 1px solid #333;
        border-radius: 5px;
        background-color: #333;
        color: #f1c40f;
        font-size: 1em;
      }

      textarea {
        resize: vertical;
        min-height: 100px;
      }

      .error {
        color: #e74c3c;
        font-size: 0.9em;
        margin-bottom: 10px;
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
export class CreateReportComponent {
  reportForm: FormGroup;
  message: string = '';

  constructor(private fb: FormBuilder, private apiService: ApiService, private router: Router) {
    this.reportForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
    });
  }

  onSubmit() {
    if (this.reportForm.valid) {
      this.apiService.createReport(this.reportForm.value).subscribe(
        (response) => {
          // Navigate back to feed
          this.router.navigate(['/feed']);
        },
        (error) => {
          console.error('Error creating report:', error);
          this.message = error.error.message || 'Failed to create report';
        }
      );
    }
  }
}
