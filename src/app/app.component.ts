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
            <i class="fas fa-cog"></i> <!-- Gear icon -->
          </button>
          <div class="dropdown-menu" [class.show]="dropdownOpen">
            <a class="dropdown-item" [routerLink]="['/welcome', getUsername()]">Home</a>
            <a class="dropdown-item" routerLink="/feed">Feed</a>
            <!-- Show "Create Post" only for authorized users -->
            <a
              *ngIf="canCreatePost()"
              class="dropdown-item"
              (click)="openCreatePostModal()"
            >
              Create Post
            </a>
            <a class="dropdown-item" routerLink="/edit-profile">Edit Profile</a>
            <a class="dropdown-item" (click)="logout()">Logout</a>
          </div>
        </div>
      </nav>
    </app-header>
    <div class="content">
      <router-outlet></router-outlet>
    </div>
    <!-- Include the modal template -->
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
    `,
  ],
})
export class AppComponent implements OnInit {
  dropdownOpen = false;
  hideNavButtons = false;
  isCreatePostModalOpen = false;
  createPostForm: FormGroup;
  createPostError: string = '';

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
    });
  }

  ngOnInit() {
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
    const role = this.apiService.getUserRole();
    return role === 'special' || role === 'moderator';
  }

  openCreatePostModal() {
    this.isCreatePostModalOpen = true;
    this.createPostForm.reset();
    this.createPostError = '';
    this.selectedFiles = []; // Reset selected files when opening the modal
  }

  closeCreatePostModal() {
    this.isCreatePostModalOpen = false;
  }

  /**
   * Handles the file selection event when users choose files to attach.
   * This method processes the selected files, validates them, and stores them in the component.
   *
   * @param event - The file input change event.
   */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
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

  submitPost() {
    if (this.createPostForm.valid) {
      const formData = new FormData();
      formData.append('title', this.createPostForm.get('title')?.value);
      formData.append('description', this.createPostForm.get('description')?.value || '');

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
}
