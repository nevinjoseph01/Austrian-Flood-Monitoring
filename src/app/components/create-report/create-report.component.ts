import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-create-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: 'create-report.component.html',
  styleUrls: [ 'create-report.component.css' ],
})
export class CreateReportComponent {
  dropdownOpen = false;
  hideNavButtons = false;
  isCreatePostModalOpen = false;
  createPostForm: FormGroup;
  createPostError: string = '';
  private map!: L.Map;
  selectedCoordinates: [number, number] = [0, 0];

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
  }

  ngOnInit(){}

  private mapInit() {
    const austriaBounds = L.latLngBounds(
      [46.372276, 9.530952],
      [49.017784, 17.160776]
    );
        
    this.map = L.map('map', {
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
    tiles.addTo(this.map);
    
    L.control.scale().addTo(this.map);
    
    let marker: L.Marker;
    
    // Handle map click
    this.map.on('click', (e: any) => {
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
      const InfoBox = document.getElementById("coords-info");
      if(InfoBox) {
        InfoBox.innerHTML = `Lat: ${this.selectedCoordinates[1]}, Lon: ${this.selectedCoordinates[0]}`;
      }

      // Update the geolocation form control
      this.createPostForm.get('lat')?.setValue(this.selectedCoordinates[1]);
      this.createPostForm.get('lon')?.setValue(this.selectedCoordinates[0]);
      this.createPostForm.get('lat')?.markAsTouched();
      this.createPostForm.get('lon')?.markAsTouched();

      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng], { icon: triangleIcon }).addTo(this.map);
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

  openCreatePostModal() {
    this.isCreatePostModalOpen = true;
    this.createPostForm.reset();
    this.createPostError = '';
    this.selectedFiles = []; // Reset selected files when opening the modal
    setTimeout(() => this.mapInit(), 0);
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
}
