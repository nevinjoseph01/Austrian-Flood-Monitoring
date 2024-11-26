import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: 'create-report.component.html',
  styleUrls: [ 'create-report.component.css' ],
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
