import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../api.service';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define the FloodAlert interface with coords as a tuple
interface FloodAlert {
  name: string;
  coords: [number, number]; // LatLngTuple
  level: string;
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'welcome.component.html',
  styleUrls: ['welcome.component.css'],
})
export class WelcomeComponent implements OnInit, AfterViewInit {
  username: string | null = '';

  private map!: L.Map;
  private waterLevelLayer!: L.GeoJSON<any>;
  private floodAlertLayer!: L.LayerGroup<any>;

  // Define flood alerts with coords as tuples
  private floodAlerts: FloodAlert[] = [
    {
      name: 'Vienna',
      coords: [48.2082, 16.3738],
      level: 'High',
    },
    {
      name: 'Graz',
      coords: [47.0707, 15.4395],
      level: 'Medium',
    },
    // Add more locations as needed
  ];

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.username = this.route.snapshot.paramMap.get('username');

    const loggedInUsername = this.apiService.getUsername();
    if (!this.apiService.getUserId() || this.username !== loggedInUsername) {
      // User is not logged in or URL does not match logged-in user, redirect to login
      this.router.navigate(['/login']);
    }
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.addLegend();
  }

  private initMap(): void {
    // Define the bounds of Austria
    const austriaBounds = L.latLngBounds(
      L.latLng(46.372276, 9.530952), // Southwest coordinates
      L.latLng(49.017784, 17.160776) // Northeast coordinates
    );

    this.map = L.map('map', {
      center: [47.5162, 14.5501], // Center of Austria
      zoom: 7,
      minZoom: 6,
      maxZoom: 12,
      maxBounds: austriaBounds,
      maxBoundsViscosity: 0.7, // Controls how elastic the bounds are
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    });

    tiles.addTo(this.map);

    // Load water-level data and add to map
    this.loadWaterLevelData().subscribe((data) => {
      this.waterLevelLayer = L.geoJSON(data, {
        style: this.styleFeature.bind(this),
        onEachFeature: this.onEachFeature.bind(this),
      }).addTo(this.map);

      // Add layer control after layers are added
      this.addLayerControl();
    });

    // Add flood alert markers
    this.addFloodAlertMarkers();

    // Add scale control
    L.control.scale().addTo(this.map);

    // Add click event for coordinates
    this.map.on('click', this.onMapClick.bind(this));
  }

  private loadWaterLevelData(): Observable<any> {
    // For demonstration, use a local or sample GeoJSON file
    return this.http.get('assets/water-levels.json');
  }

  private styleFeature(feature: any) {
    const waterLevel = feature.properties.waterLevel;
    const color = this.getColor(waterLevel);

    return {
      color: color,
      weight: 2,
      opacity: 0.8,
    };
  }

  private getColor(waterLevel: number): string {
    return waterLevel > 6
      ? '#800026'
      : waterLevel > 5
        ? '#BD0026'
        : waterLevel > 4
          ? '#E31A1C'
          : waterLevel > 3
            ? '#FC4E2A'
            : waterLevel > 2
              ? '#FD8D3C'
              : waterLevel > 1
                ? '#FEB24C'
                : '#FFEDA0';
  }

  private onEachFeature(feature: any, layer: L.Layer) {
    if (feature.properties && feature.properties.name) {
      layer.bindPopup(
        `<strong>${feature.properties.name}</strong><br>Water Level: ${feature.properties.waterLevel}m`
      );
    }
  }

  private addLegend() {
    // Define a class that extends L.Control
    class LegendControl extends L.Control {
      constructor(options?: L.ControlOptions) {
        super(options);
      }

      // Add 'override' keyword to comply with TypeScript 4.3+
      override onAdd(map: L.Map) {
        const div = L.DomUtil.create('div', 'info legend');
        const grades = [0, 1, 2, 3, 4, 5, 6];

        div.innerHTML += '<strong>Water Level (m)</strong><br>';

        // Define getColor function inside onAdd
        const getColor = (waterLevel: number): string => {
          return waterLevel > 6
            ? '#800026'
            : waterLevel > 5
              ? '#BD0026'
              : waterLevel > 4
                ? '#E31A1C'
                : waterLevel > 3
                  ? '#FC4E2A'
                  : waterLevel > 2
                    ? '#FD8D3C'
                    : waterLevel > 1
                      ? '#FEB24C'
                      : '#FFEDA0';
        };

        for (let i = 0; i < grades.length; i++) {
          div.innerHTML +=
            '<i style="background:' +
            getColor(grades[i] + 1) +
            '"></i> ' +
            grades[i] +
            (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }

        return div;
      }

      // Add 'override' keyword to comply with TypeScript 4.3+
      override onRemove(map: L.Map) {
        // Optional cleanup code here
      }
    }

    const legend = new LegendControl({ position: 'bottomright' });
    legend.addTo(this.map);
  }

  private addFloodAlertMarkers() {
    this.floodAlertLayer = L.layerGroup();

    this.floodAlerts.forEach((alert) => {
      const marker = L.circleMarker(alert.coords, {
        radius: 8,
        fillColor: this.getAlertColor(alert.level),
        color: '#000',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
      });

      marker.bindPopup(`<strong>${alert.name}</strong><br>Flood Level: ${alert.level}`);
      marker.addTo(this.floodAlertLayer);
    });

    this.floodAlertLayer.addTo(this.map);
  }

  private getAlertColor(level: string): string {
    switch (level) {
      case 'High':
        return '#FF0000'; // Red
      case 'Medium':
        return '#FFA500'; // Orange
      case 'Low':
        return '#FFFF00'; // Yellow
      default:
        return '#00FF00'; // Green
    }
  }

  private addLayerControl() {
    const overlayMaps = {
      'Water Levels': this.waterLevelLayer,
      'Flood Alerts': this.floodAlertLayer,
    };

    // Replace null with empty object {}
    L.control.layers({}, overlayMaps).addTo(this.map);
  }

  private onMapClick(e: L.LeafletMouseEvent) {
    const popup = L.popup()
      .setLatLng(e.latlng)
      .setContent(`Latitude: ${e.latlng.lat.toFixed(5)}, Longitude: ${e.latlng.lng.toFixed(5)}`)
      .openOn(this.map);
  }
}
