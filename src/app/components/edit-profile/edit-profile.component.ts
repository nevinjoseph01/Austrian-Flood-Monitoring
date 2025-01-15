import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service'; // Import ApiService
import { ActivatedRoute, Router } from '@angular/router'; // Import Router
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
})
export class EditProfileComponent implements OnInit {
  private userId: string | null = null;
  showLocationForm = false;
  showPwdForm = false;
  selectedCoordinates: [number, number] = [0, 0];
  private map!: L.Map;
  locationSaved: boolean = false; // Flag for successful save
  pwdSaved: boolean = false; // Flag for successful save
  errorMessage: string | null = null; // Error message if saving fails

  updatePwdError: string = '';
  updatePwdForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService, // Inject ApiService
    private router: Router, // Inject Router (optional for redirection)
    private fb: FormBuilder
  ) {
    this.updatePwdForm = this.fb.group({
      oldpass: ['', Validators.required],
      newpass1: ['', Validators.required],
      newpass2: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.userId = this.apiService.getUserId();
    if (!this.userId) {
      // User is not logged in or URL does not match logged-in user, redirect to login
      this.router.navigate(['/login']);
    }
  }

  toggleLocationForm() {
    this.showLocationForm = !this.showLocationForm;
    if (this.showLocationForm) {
      setTimeout(() => this.initMap(), 0);
    }
  }

  openPwdForm() {
    this.showPwdForm = true;
    this.updatePwdForm.reset();
    this.updatePwdError = '';
  }

  closePwdForm() {
    this.showPwdForm = false;
  }

  private initMap() {
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
      zoomControl: false,
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    });
    tiles.addTo(this.map);

    let marker: L.Marker;

    this.map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;

      const triangleIcon = L.divIcon({
        className: 'custom-icon',
        html: `<div style="width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 20px solid red;"></div>`,
        iconAnchor: [10, 25],
      });

      this.selectedCoordinates = [lng, lat];
      const InfoBox = document.getElementById('coords-info');
      if (InfoBox) {
        InfoBox.innerHTML = `Lat: ${this.selectedCoordinates[1]}, Lon: ${this.selectedCoordinates[0]}`;
      }

      // Add or update marker based on the click location
      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng], { icon: triangleIcon }).addTo(this.map);
      }
    });
  }

  // Function that gets called when the user submits the location
  onSubmitLocation() {
    const lat = this.selectedCoordinates[1]; // Latitude (second value)
    const lon = this.selectedCoordinates[0]; // Longitude (first value)
  
    // Validate the coordinates
    if (isNaN(lat) || isNaN(lon)) {
      this.errorMessage = 'Invalid coordinates';
      return;
    }
  
    if (!this.userId) {
      this.errorMessage = 'User not logged in.';
      return;
    }
  
    // Call the API to save the location
    this.apiService.updateLocation(this.userId, [lon, lat]).subscribe(
      (response) => {
        this.locationSaved = true; // Flag for success
        this.errorMessage = null; // Clear previous error messages
        alert('Location updated successfully!');
      },
      (error) => {
        this.locationSaved = false; // Flag for failure
        this.errorMessage = error.error.message || 'Failed to update location.';
      }
    );
  }  

  // Function that gets called when the user submits the location
  onSubmitPassword() {
    if (!this.userId) {
      this.updatePwdError = 'User not logged in.';
      return;
    }

    if (this.updatePwdForm.get('oldpass')?.value != this.apiService.getUserpwd()) {
      this.updatePwdError = 'The old password is incorrect.';
      return;
    }
    
    if (this.updatePwdForm.get('newpass1')?.value != this.updatePwdForm.get('newpass2')?.value) {
      this.updatePwdError = 'The two new passwords must match.';
      return;
    }

    const newPassword = this.updatePwdForm.get('newpass1')?.value;
  
    // Call the API to save the location
    this.apiService.updatePassword(this.userId, String(newPassword)).subscribe(
      (response) => {
        this.pwdSaved = true; // Flag for success
        this.updatePwdError = ''; // Clear previous error messages
        alert('Password updated successfully!');
      },
      (error) => {
        console.error('Error updating password:', error);
        // Show error message
        this.updatePwdError = error.error.message || 'Failed to update password.';
      }
    );
  }  
}
