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
  dropdownOpen = false;
  hideNavButtons = false;

  isCreateTaskModalOpen = false;
  createTaskForm: FormGroup;
  createTaskError: string = '';

  isAssignedToFocused: boolean = false;
  userlist: any = [];
  usernamelist: any[] = [];

  // Add selectedFiles property to hold the selected files
  selectedFiles: File[] = [];

  constructor(
    private apiService: ApiService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.createTaskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      progress: ['Not done'],
      assignedTo: [''],
    });
  }

  ngOnInit() 
  {
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

  isLoggedIn(): boolean {
    return !!this.apiService.getUserId();
  }

  getUsername(): string | null {
    return this.apiService.getUsername();
  }

  logout() {
    this.apiService.logout();
    this.router.navigate(['']);
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  canCreateTask(): boolean {
    const role = this.apiService.getUserRole() || '';
    return role === 'special' || role === 'moderator';
  }

  openCreateTaskModal() {
    this.isCreateTaskModalOpen = true;
    this.createTaskForm.reset({
      title: '',
      description: '',
      progress: 'Not done', // Default value preserved 😎
      assignedTo: '',
    });
    this.createTaskError = '';
    this.selectedFiles = []; // Reset selected files when opening the modal
  }

  closeCreateTaskModal() {
    this.isCreateTaskModalOpen = false;
  }

  /**
   * Handles the file selection event when users choose files to attach.
   * This method processes the selected files, validates them, and stores them in the component.
   *
   * @param event - The file input change event.
   */
  onFileSelected(event: Event) 
  {
    const input = event.target as HTMLInputElement;
    if (input.files) 
    {
      // Convert FileList to Array
      const files = Array.from(input.files);
      const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      const validFiles: File[] = [];

      for (let file of files) {
        if (!allowedTypes.includes(file.type)) {
          alert(`Unsupported file type: ${file.name}`);
          continue;
        }
        if (file.size > maxSize) {
          alert(`File too large (max 10MB): ${file.name}`);
          continue;
        }
        validFiles.push(file);
      }

      this.selectedFiles = validFiles.slice(0, 5); // Limit to 5 files
    }
  }

  submitTask() 
  {
    if (this.createTaskForm.valid) {
      const formData = new FormData();
      formData.append('title', this.createTaskForm.get('title')?.value);
      formData.append('description', this.createTaskForm.get('description')?.value || '');
      formData.append('progress', this.createTaskForm.get('progress')?.value || 'Not done');
      formData.append('assignedTo', this.createTaskForm.get('assignedTo')?.value || '');

      // Append selected files
      this.selectedFiles.forEach((file) => {
        formData.append('media', file);
      });

      this.apiService.createTask(formData).subscribe(
        (response) => {
          this.closeCreateTaskModal();
          // Optionally, refresh the feed or navigate
          this.router.navigate(['/tasks']);
        },
        (error) => {
          console.error('Error creating task:', error);
          // Show error message
          this.createTaskError = error.error.message || 'Failed to create task.';
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
        this.createTaskForm.get('assignedTo')?.setValue(name);
      }
      else {
        inputElement.value = '';
      }
    }
  }
}