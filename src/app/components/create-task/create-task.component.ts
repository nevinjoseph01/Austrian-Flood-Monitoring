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
  isCreateTaskModalOpen = false;
  taskForm: FormGroup;
  createTaskError: string = '';
  message: string = '';

  isAssignedToFocused: boolean = false;
  userlist: any = [];
  usernamelist: any[] = [];

  constructor(private fb: FormBuilder, private apiService: ApiService, private router: Router) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      progress: ['Not done'],
      assignedTo: [''],
    });
  }

  ngOnInit() {
    this.apiService.getUsernames().subscribe({
      next: (response) => {
        this.userlist = response.usernames;
      },
      error: (err) => {
        console.error('Error fetching usernames:', err);
        this.userlist = [''];
      }
    });
  }

  openCreateTaskModal() {
    this.isCreateTaskModalOpen = true;
    this.taskForm.reset({
      title: '',
      description: '',
      progress: 'Not done', // Default value preserved 😎
      assignedTo: '',
    });
    this.createTaskError = '';
  }

  closeCreateTaskModal() {
    this.isCreateTaskModalOpen = false;
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

  onAssignedToFocus(): void {
    this.isAssignedToFocused = true;
  }
  
  onAssignedToBlur(): void {
    this.isAssignedToFocused = false;
    setTimeout(() => {
      this.usernamelist = [];
    },250);
    
  }

  onAssignedToInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;

    if(this.isAssignedToFocused) {
      const username = inputElement.value;
      
      const users: any[] = []
      this.userlist.forEach((user: any) => {
        if(user.indexOf(username) >= 0) {
          users.push(user);
        }
      });

      this.usernamelist = users;
    }
    // Perform any additional logic with the new value
  }

  onUsernameContentClick(event: Event): void {
    const usernameHolder = event.target as HTMLInputElement;
    const name = usernameHolder.firstChild?.textContent;
    const inputElement = document.querySelector('.assigned_to_box') as HTMLInputElement;
    
    if (inputElement) {
      if(name) {
        inputElement.value = name;
      }
      else {
        inputElement.value = '';
      }
    }
  }
}
