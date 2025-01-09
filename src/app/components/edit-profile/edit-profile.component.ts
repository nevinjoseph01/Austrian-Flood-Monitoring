import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service'; // Import ApiService
import { Router } from '@angular/router'; // Import Router
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class EditProfileComponent implements OnInit {
  showLocationForm = false;
  selectedCoordinates: [number, number] = [0, 0];
  private map!: L.Map;
  locationSaved: boolean = false; // Flag for successful save
  errorMessage: string | null = null; // Error message if saving fails

  constructor(
    private apiService: ApiService, // Inject ApiService
    private router: Router // Inject Router (optional for redirection)
  ) {}

  ngOnInit(): void {}

  toggleLocationForm() {
    this.showLocationForm = !this.showLocationForm;
    if (this.showLocationForm) {
      setTimeout(() => this.initMap(), 0);
    }
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
      console.log('Invalid coordinates:', lat, lon);
      return;
    }
  
    const userId = this.apiService.getUserId(); // Get the user ID from ApiService
    if (!userId) {
      this.errorMessage = 'User not logged in.';
      console.log('User not logged in.');
      return;
    }
  
    console.log('Valid coordinates:', lon, lat);  // Ensure correct order
  
    // Call the API to save the location
    this.apiService.updateLocation(userId, [lon, lat]).subscribe(
      (response) => {
        this.locationSaved = true; // Flag for success
        this.errorMessage = null; // Clear previous error messages
        console.log('Location updated successfully:', response);
        alert('Location updated successfully!');
      },
      (error) => {
        this.locationSaved = false; // Flag for failure
        this.errorMessage = error.error.message || 'Failed to update location.';
        console.error('Error updating location:', error);
      }
    );
  }  
}
