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
  reportForm: FormGroup;
  message: string = '';

  constructor(private fb: FormBuilder, private apiService: ApiService, private router: Router) {
    this.reportForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      geolocation: ['', Validators.required],
    });
  }

  private map!: L.Map;
  selectedCoordinates: [number, number] = [0, 0];

  ngAfterViewInit(): void {
    const austriaBounds = L.latLngBounds(
          [46.372276, 9.530952],
          [49.017784, 17.160776]
        );
    
    this.map = L.map('landing-map', {
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

      this.selectedCoordinates = [lng, lat];

      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng]).addTo(this.map);
      }
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

