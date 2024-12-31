import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-task',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: 'create-task.component.html',
  styleUrls: [ 'create-task.component.css' ],
})
export class CreateTaskComponent {
  taskForm: FormGroup;
  message: string = '';

  constructor(private fb: FormBuilder, private apiService: ApiService, private router: Router) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      assignedTo: [''],
    });
  }

  onTaskSubmit() {
    if (this.taskForm.valid) {
      this.apiService.createTask(this.taskForm.value).subscribe(
        (response) => {
          // Navigate back to tasks
          this.router.navigate(['/tasks']);
        },
        (error) => {
          console.error('Error creating task:', error);
          this.message = error.error.message || 'Failed to create task';
        }
      );
    }
  }
}
