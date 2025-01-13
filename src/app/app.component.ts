import { Component, OnInit } from '@angular/core';
import {
  RouterModule,
  Router,
  NavigationEnd,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ApiService } from './api.service';
import { filter } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    ReactiveFormsModule,
  ],
  template: `
    <app-header>
      <nav class="navigation" *ngIf="!hideNavButtons">
        <div *ngIf="isLoggedIn()" class="dropdown">
          <button class="nav-button dropdown-toggle" (click)="toggleDropdown()">
            <i class="fas fa-plus"></i> <!-- Gear icon -->
          </button>
          <div class="dropdown-menu" [class.show]="dropdownOpen">
            <a class="dropdown-item" [routerLink]="['/welcome', getUsername()]">Home</a>
            <a class="dropdown-item" routerLink="/feed">Feed</a>
            <a class="dropdown-item" routerLink="/tasks">Tasks</a>
            <!-- Show "Create Post" only for authorized users -->
            <a
              *ngIf="canCreatePost()"
              class="dropdown-item"
              (click)="openCreatePostModal()"
            >
              Create Post
            </a>
            <!-- Show "Create Task" only for authorized users -->
            <a
              *ngIf="canCreateTask()"
              class="dropdown-item"
              (click)="openCreateTaskModal()"
            >
              Create Task
            </a>
            <a class="dropdown-item" routerLink="/edit-profile">Edit Profile</a>
          </div>
        </div>
        <button *ngIf="isLoggedIn()" class="nav-button logout-button" (click)="logout()">
          <i class="fas fa-sign-out-alt"></i> <!-- Logout icon -->
        </button>
      </nav>
    </app-header>
    <div class="content">
      <router-outlet></router-outlet>
    </div>
    <!-- Include the post modal template -->
    <div *ngIf="isCreatePostModalOpen" class="modal-overlay" (click)="closeCreatePostModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h2>Create a Post</h2>
        <form [formGroup]="createPostForm" (ngSubmit)="submitPost()">
          <label>
            Title:
            <input formControlName="title" />
          </label>
          <div
            class="error"
            *ngIf="createPostForm.get('title')?.invalid && createPostForm.get('title')?.touched"
          >
            Title is required.
          </div>
          <label>
            Description:
            <textarea formControlName="description"></textarea>
          </label>
          <!-- Add file input for media attachments -->
          <label>
            Attach Media:
            <input type="file" (change)="onFileSelected($event)" multiple />
          </label>
          <!-- Display selected files -->
          <div class="file-list" *ngIf="selectedFiles.length > 0">
            <p>Selected Files:</p>
            <ul>
              <li *ngFor="let file of selectedFiles">{{ file.name }}</li>
            </ul>
          </div>
          <!-- Geolocation Selection -->
          <label>
            Select Location on Map:
            <div id="coords-info-post"></div>
            <div id="map_post"></div>
            <input
              type="hidden" 
              formControlName="lon"
              [value]="selectedCoordinates[0] | json"
            />
            <input
              type="hidden" 
              formControlName="lat"
              [value]="selectedCoordinates[1] | json"
            />
          </label>
          <div *ngIf="createPostError" class="error">
            {{ createPostError }}
          </div>
          <div class="modal-actions">
            <button type="submit" [disabled]="createPostForm.invalid">Post</button>
            <button type="button" (click)="closeCreatePostModal()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
    <!-- Include the task modal template -->
    <div *ngIf="isCreateTaskModalOpen" class="modal-overlay" (click)="closeCreateTaskModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h2>Create a Task</h2>
        <form [formGroup]="createTaskForm" (ngSubmit)="submitTask()">
          <label>
            Title:
            <input formControlName="title" />
          </label>
          <div
            class="error"
            *ngIf="createTaskForm.get('title')?.invalid && createTaskForm.get('title')?.touched"
          >
            Title is required.
          </div>
          <label>
            Assigned user:
            <input class="assigned_to_box"
            formControlName="assignedTo"
            (focus)="onAssignedToFocus()" 
            (blur)="onAssignedToBlur()" 
            (input)="onAssignedToInput($event)" />
            <div *ngIf="usernamelist.length === 0" id="no-usernames"></div>
            <div *ngFor="let name of usernamelist" id="username-card">
              <div class="username-content" (click)="onUsernameContentClick($event)">
                <div>{{ name }}</div>
              </div>
            </div>
          </label>
          <label>
            Description:
            <textarea formControlName="description"></textarea>
          </label>
          <label>
            Progress:
            <select formControlName="progress">
              <option value="Not done" selected>Not done</option>
              <option value="In progress">In progress</option>
              <option value="Done">Done</option>
            </select>
          </label>
          <!-- Geolocation Selection -->
          <label>
            Select Location on Map:
            <div id="coords-info-task"></div>
            <div id="map_task"></div>
            <input
              type="hidden" 
              formControlName="lon"
              [value]="selectedCoordinates[0] | json"
            />
            <input
              type="hidden" 
              formControlName="lat"
              [value]="selectedCoordinates[1] | json"
            />
          </label>
          <!-- Add file input for media attachments -->
          <label>
            Attach Media:
            <input type="file" (change)="onFileSelected($event)" multiple />
          </label>
          <!-- Display selected files -->
          <div class="file-list" *ngIf="selectedFiles.length > 0">
            <p>Selected Files:</p>
            <ul>
              <li *ngFor="let file of selectedFiles">{{ file.name }}</li>
            </ul>
          </div>
          <div *ngIf="createTaskError" class="error">
            {{ createTaskError }}
          </div>
          <div class="modal-actions">
            <button type="submit" [disabled]="createTaskForm.invalid">Publish</button>
            <button type="button" (click)="closeCreateTaskModal()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
    <app-footer></app-footer>
  `,
  styles: [
    `
      .nav-button {
        background-color: #1a1a1a;
        color: #f1c40f;
        border: none;
        padding: 10px;
        font-size: 24px;
        cursor: pointer;
        display: flex;
        align-items: flex-end;
      }
      .logout-button {
        margin-left: 10px;
        background-color: #1a1a1a;
        color: #f1c40f;
        border: none;
        padding: 10px;
        font-size: 18px;
        cursor: pointer;
        display: inline-block; /* Ensure it aligns with other inline elements */
        vertical-align: middle; /* Align vertically with other elements */
      }

      .dropdown {
        position: relative;
        display: inline-block;
      }

      .dropdown-toggle::after {
        content: '';
      }

      .dropdown-menu {
        display: none;
        position: absolute;
        right: 0;
        background-color: #1a1a1a;
        min-width: 160px;
        box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.2);
        z-index: 1;
        margin-top: 5px;
      }

      .dropdown-menu.show {
        display: block;
      }

      .dropdown-item {
        color: #f1c40f;
        padding: 12px 16px;
        text-decoration: none;
        display: block;
        cursor: pointer;
      }

      .dropdown-item:hover {
        background-color: #333;
      }

      .content {
        padding-top: 50px;
        min-height: calc(100vh - 160px); /* Adjust based on header and footer height */
      }

      /* Modal Styles */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .modal-content {
        background-color: #1a1a1a;
        padding: 20px;
        border-radius: 10px;
        width: 80%;
        max-width: 500px;
        color: #f1c40f;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      .modal-content h2 {
        margin-top: 0;
      }

      .modal-content label {
        display: block;
        margin-bottom: 10px;
      }

      .modal-content input,
      .modal-content textarea {
        width: 96.5%;
        padding: 8px;
        border: 1px solid #333;
        border-radius: 5px;
        background-color: #333;
        color: #f1c40f;
        font-size: 1em;
      }

      .modal-content textarea {
        resize: vertical;
        min-height: 100px;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
      }

      .modal-actions button {
        margin-left: 10px;
        padding: 10px 20px;
        background-color: #f1c40f;
        color: #1a1a1a;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 1em;
      }

      .modal-actions button:hover {
        background-color: #d4ac0d;
      }

      .modal-content .error {
        color: #e74c3c;
        font-size: 0.9em;
        margin-bottom: 10px;
      }

      .file-list {
        margin-top: 10px;
        color: #f1c40f;
      }

      .file-list ul {
        list-style-type: disc;
        padding-left: 20px;
      }

      .file-list li {
        margin-bottom: 5px;
      }

      #map_post {
        height: 150px;
      }

      #map_task {
        height: 150px;
      }

      #coords-info-post {
      margin-top: 10px; 
      color: #f1c40f; 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      #coords-info-task {
      margin-top: 10px; 
      color: #f1c40f; 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      #username-card {
      position: relative;
      top: -3px;
      background: #dddddd;
      border: 3px solid black;
      border-radius: 10px;
      padding: 0px;
      width: 200px;
      height: 30px;
      }

      .username-content {
      color: black;
      padding-left: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid grey;
      border-radius: 10px 10px 0px 0px;
      }

      .username-content:hover {
      background: #aaaaaa;
      cursor: pointer;
      }
    `,
  ],
})
export class AppComponent implements OnInit 
{
  dropdownOpen = false;
  hideNavButtons = false;
  isCreatePostModalOpen = false;
  createPostForm: FormGroup;
  createPostError: string = '';
  private map_form!: L.Map;
  selectedCoordinates: [number, number] = [0, 0];

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
    this.createPostForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      lat: ['', Validators.required],
      lon: ['', Validators.required],
    });

    this.createTaskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      progress: ['Not done'],
      assignedTo: [''],
      lat: ['', Validators.required],
      lon: ['', Validators.required],
    });
  }

  ngOnInit() 
  {
    this.router.events
    .pipe(filter((event) => event instanceof NavigationEnd))
    .subscribe((event: NavigationEnd) => {
      const currentUrl = event.urlAfterRedirects;
      if (currentUrl === '/login' || currentUrl === '/register') {
        this.hideNavButtons = true;
      } else {
        this.hideNavButtons = false;
      }
      // Close dropdown when navigating
      this.dropdownOpen = false;
    });

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

  private mapInit(id_name: string, coords_info_name: string) {
    const austriaBounds = L.latLngBounds(
      [46.372276, 9.530952],
      [49.017784, 17.160776]
    );
        
    this.map_form = L.map(id_name, {
      center: [47.5162, 14.5501], // Center of Austria
      zoom: 7,
      minZoom: 6,
      maxZoom: 12,
      maxBounds: austriaBounds,
      maxBoundsViscosity: 0.7,
      zoomControl: false
    });
        
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    });
    tiles.addTo(this.map_form);
    
    L.control.scale().addTo(this.map_form);
    
    let marker: L.Marker;
    
    // Handle map click
    this.map_form.on('click', (e: any) => {
      const { lat, lng } = e.latlng;

      const triangleIcon = L.divIcon({
        className: 'custom-icon',
        html: `<div style="
        width: 0; height: 0; border-left: 
        10px solid transparent; 
        border-right: 10px solid transparent; 
        border-top: 20px solid red;"></div>`,
        iconAnchor: [10, 25],   // Positioning the triangle so that the bottom point will be where the user clicks
      });

      this.selectedCoordinates = [lng, lat];
      const InfoBox = document.getElementById(coords_info_name);
      if(InfoBox) {
        InfoBox.innerHTML = `Lat: ${this.selectedCoordinates[1]}, Lon: ${this.selectedCoordinates[0]}`;
      }

      // Update the geolocation form control
      if (this.isCreatePostModalOpen) {
        this.createPostForm.get('lat')?.setValue(this.selectedCoordinates[1]);
        this.createPostForm.get('lat')?.markAsTouched();

        this.createPostForm.get('lon')?.setValue(this.selectedCoordinates[0]);
        this.createPostForm.get('lon')?.markAsTouched();
      } 
      
      if (this.isCreateTaskModalOpen) {
        this.createTaskForm.get('lat')?.setValue(this.selectedCoordinates[1]);
        this.createTaskForm.get('lat')?.markAsTouched();

        this.createTaskForm.get('lon')?.setValue(this.selectedCoordinates[0]);
        this.createTaskForm.get('lon')?.markAsTouched();
      }

      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng], { icon: triangleIcon }).addTo(this.map_form);
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

  canCreatePost(): boolean {
    const role = this.apiService.getUserRole() || '';
    return role === 'special' || role === 'moderator' || role === 'normal';
  }

  canCreateTask(): boolean {
    const role = this.apiService.getUserRole() || '';
    return role === 'special' || role === 'moderator';
  }

  openCreatePostModal() {
    this.isCreatePostModalOpen = true;
    this.createPostForm.reset();
    this.createPostError = '';
    this.selectedFiles = []; // Reset selected files when opening the modal
    setTimeout(() => this.mapInit('map_post', "coords-info-post"), 0);
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
    setTimeout(() => this.mapInit('map_task', "coords-info-task"), 0);
  }

  closeCreatePostModal() {
    this.isCreatePostModalOpen = false;
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

  submitPost() 
  {
    if (this.createPostForm.valid) 
    {
      const formData = new FormData();
      formData.append('title', this.createPostForm.get('title')?.value);
      formData.append('description', this.createPostForm.get('description')?.value || '');
      formData.append('lat', this.createPostForm.get('lat')?.value || '');
      formData.append('lon', this.createPostForm.get('lon')?.value || '');
      
      // Append selected files
      this.selectedFiles.forEach((file) => {
        formData.append('media', file);
      });

      this.apiService.createReport(formData).subscribe(
        (response) => {
          this.closeCreatePostModal();
          // Optionally, refresh the feed or navigate
          this.router.navigate(['/feed']);
        },
        (error) => {
          console.error('Error creating report:', error);
          // Show error message
          this.createPostError = error.error.message || 'Failed to create post.';
        }
      );
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
      formData.append('lat', this.createTaskForm.get('lat')?.value || '');
      formData.append('lon', this.createTaskForm.get('lon')?.value || '');

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