import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser'; // Import DomSanitizer
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import * as L from 'leaflet';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
      CommonModule,
      ReactiveFormsModule,
    ],
  templateUrl: 'tasks.component.html',
  styleUrls: ['tasks.component.css']
})
export class TasksComponent implements OnInit {
  username: string | null = '';
  tasks: any[] = [];
  
  isEditTaskModalOpen = false;
  editTaskForm: FormGroup;
  editTaskError: string = '';
  taskId!: string;

  isAssignedToFocused: boolean = false;
  userlist: any = [];
  usernamelist: any[] = [];

  selectedFiles: File[] = [];
  private map_form!: L.Map;
  private markerGroup!: L.LayerGroup;
  selectedCoordinates: [Number, Number] = [0, 0];

  constructor(
    private apiService: ApiService, 
    private sanitizer: DomSanitizer,
    private router: Router,
    private fb: FormBuilder,
  ) {
    this.editTaskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      progress: ['Not done'],
      assignedTo: [''],
      lat: ['', Validators.required],
      lon: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.username = this.apiService.getUsername();

    if (!this.apiService.getUserId()) {
      this.router.navigate(['/login']);
    }

    this.apiService.getUsernames().subscribe({
      next: (response) => {
        this.userlist = response.usernames;
      },
      error: (err) => {
        console.error('Error fetching usernames:', err);
        this.userlist = [''];
      }
    });
    
    this.loadTasks();
  }

  loadTasks() {
    this.apiService.getTasks().subscribe(
      (data) => {
        this.tasks = data.tasks;
      },
      (error) => {
        console.error('Error fetching tasks:', error);
      }
    );
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
    
    this.markerGroup = L.layerGroup().addTo(this.map_form);
    
    // Handle map click
    this.map_form.on('click', (e: any) => {
      const { lat, lng } = e.latlng;

      this.setMapIcon(lat, lng, coords_info_name);
      
      if (this.isEditTaskModalOpen) {
        this.editTaskForm.get('lat')?.setValue(this.selectedCoordinates[1]);
        this.editTaskForm.get('lat')?.markAsTouched();

        this.editTaskForm.get('lon')?.setValue(this.selectedCoordinates[0]);
        this.editTaskForm.get('lon')?.markAsTouched();
      }
    });
  }

  setMapIcon(lat: any, lng: any, coords_info_name: string) {
    const triangleIcon: L.DivIcon = L.divIcon({
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

    setTimeout(() => this.markerGroup.clearLayers(), 100);
    setTimeout(() => L.marker([lat, lng], { icon: triangleIcon }).addTo(this.markerGroup), 100);
  }

  openEditTaskModal(task: any) {
    this.taskId = task._id;
    this.isEditTaskModalOpen = true;
    this.editTaskError = '';
    this.editTaskForm.reset({
      title: task.title || '',
      description: task.description || '',
      progress: task.progress || 'Not done',
      assignedTo: task.assignedTo.username || '',
      lat: task.geolocation.coordinates[1] || '',
      lon: task.geolocation.coordinates[0] || '',
    });

    this.setMapIcon(task.geolocation.coordinates[1], task.geolocation.coordinates[0], "coords-info-task-edit");

    this.selectedFiles = [];
    setTimeout(() => this.mapInit('map_task_edit', "coords-info-task-edit"), 0);
  }

  closeEditTaskModal() {
    this.isEditTaskModalOpen = false;
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

  saveTask() {
    if (this.editTaskForm.valid) {
      const formData = new FormData();
      formData.append('title', this.editTaskForm.get('title')?.value);
      formData.append('description', this.editTaskForm.get('description')?.value || '');
      formData.append('progress', this.editTaskForm.get('progress')?.value || 'Not done');
      formData.append('assignedTo', this.editTaskForm.get('assignedTo')?.value || '');
      formData.append('lat', this.editTaskForm.get('lat')?.value || '');
      formData.append('lon', this.editTaskForm.get('lon')?.value || '');

      // Append selected files
      this.selectedFiles.forEach((file) => {
        formData.append('media', file);
      });
      console.log(formData.getAll('title'), formData.getAll('description'), formData.getAll('progress'), formData.getAll('assignedTo'), formData.getAll('lat'), formData.getAll('lon'));
      this.apiService.updateTask(this.taskId, formData).subscribe(
        (response) => {
          this.closeEditTaskModal();
          // Optionally, refresh the feed or navigate
          this.router.navigate(['/tasks']);
        },
        (error) => {
          console.error('Error editing task:', error);
          // Show error message
          this.editTaskError = error.error.message || 'Failed to edit task.';
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
        this.editTaskForm.get('assignedTo')?.setValue(name);
      }
      else {
        inputElement.value = '';
      }
    }
  }

  /**
   * Constructs a safe URL for the media file, bypassing Angular's security checks.
   * @param path The relative path to the media file.
   * @returns A SafeUrl that can be used in the template.
   */
  getMediaUrl(path: string): SafeUrl {
    // Adjust the base URL if your backend is running on a different host or port
    return this.sanitizer.bypassSecurityTrustResourceUrl(`http://localhost:3000/${path}`);
  }

  /**
   * Determines the media type based on the MIME type.
   * @param mimeType The MIME type of the media file.
   * @returns A string representing the media type: 'image', 'video', 'pdf', or 'unknown'.
   */
  getMediaType(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (mimeType === 'application/pdf') {
      return 'pdf';
    } else {
      return 'unknown';
    }
  }
}
