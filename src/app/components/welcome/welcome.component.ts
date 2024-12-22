import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../api.service';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getWaterData } from '../../../assets/fetch';
import { GeoJsonGeometryTypes } from 'geojson';

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
  private floodAlerts: FloodAlert[] = [];

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
    this.loadWaterLevelData().then((data: GeoJSON.FeatureCollection) => {
      console.log(data)
      this.floodAlertLayer = L.layerGroup();
      this.waterLevelLayer = L.geoJSON(data, {
        pointToLayer: (feature, latlng) => {
          return L.circleMarker(latlng, {
            radius: 8,
            fillColor: this.getColor(feature.properties.waterLevel),
            color: '#000',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
          });
        },
        onEachFeature: this.onEachFeature.bind(this),
      }).addTo(this.map);

      this.addLayerControl();
      this.addFloodAlerts();
    });

    // Add scale control
    L.control.scale().addTo(this.map);

    // Add click event for coordinates
    this.map.on('click', this.onMapClick.bind(this));
  }

  private loadWaterLevelData(): Promise<GeoJSON.FeatureCollection> {
    var waterData = getWaterData();
    // Fetches the water data every 10 minutes
    setInterval(async function (){
      var waterData = await getWaterData();
      return waterData;
    }, 10 * 60 * 1000);
    return waterData;
  }

  /*private styleFeature(feature: any) {
    const waterLevel = feature.properties.waterLevel;
    const color = this.getColor(waterLevel);
  
    return {
      fillColor: color,
      weight: 2,
      opacity: 1,
      color: 'black', // Border color
      fillOpacity: 0.8,
    };
  }*/

  private getColor(waterLevel: number): string {
    return waterLevel > 1500
        ? '#062C67'
        : waterLevel > 1200
          ? '#1B4F8A'
          : waterLevel > 900
            ? '#3473A6'
            : waterLevel > 600
              ? '#5A94C3'
              : waterLevel > 300
                ? '#86B4D4'
                : waterLevel > 50
                  ? '#ABCDE5'
                  : '#D3E7F8';
    }

  private onEachFeature(feature: any, layer: L.Layer) {
    if (feature.properties && feature.properties.name) {
      this.floodAlerts.push(this.createFloodAlertObject(feature));
      layer.bindPopup(
        `<strong>${feature.properties.name}</strong><br>
        Water Level: ${feature.properties.waterLevel}m<br>
        Closest body of water: ${feature.properties.area}<br>
        Last available data: ${feature.properties.timeStamp}<br>
        More details <a href = '${feature.properties.detailsLink}'>here</a><br>
        `
      );
    }
  }

  private addLegend() {
  // Define a class that extends L.Control for Water Level legend
  class LegendControl extends L.Control {
    constructor(options?: L.ControlOptions) {
      super(options);
    }

    override onAdd(map: L.Map) {
      const div = L.DomUtil.create('div', 'info legend');
      const grades = [0, 50, 300, 600, 900, 1200, 1500];

      div.innerHTML += '<strong>Water Level (m)</strong><br>';

      // Define getColor function inside onAdd
      const getColor = (waterLevel: number): string => {
        return waterLevel > 1500
          ? '#800026'
          : waterLevel > 1200
          ? '#BD0026'
          : waterLevel > 900
          ? '#E31A1C'
          : waterLevel > 600
          ? '#FC4E2A'
          : waterLevel > 300
          ? '#FD8D3C'
          : waterLevel > 50
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

    override onRemove(map: L.Map) {
      // Optional cleanup code here
    }
  }

  // Define a class for the Flood Alerts legend
  class FloodAlertLegendControl extends L.Control {
    constructor(options?: L.ControlOptions) {
      super(options);
    }

    override onAdd(map: L.Map) {
      const div = L.DomUtil.create('div', 'info legend flood-alert-legend');
      div.innerHTML += '<strong>Flood Alerts</strong><br>';
      div.innerHTML +=
        '<i style="background: #FF0000"></i> High Alert<br>' +
        '<i style="background: #FFA500"></i> Medium Alert<br>' +
        '<i style="background: #FFFF00"></i> Low Alert<br>';
      return div;
    }

    override onRemove(map: L.Map) {
      // Optional cleanup code here
    }
  }

  // Add the Water Level legend to the bottom right
  const waterLevelLegend = new LegendControl({ position: 'bottomright' });
  waterLevelLegend.addTo(this.map);

  // Add the Flood Alerts legend to the top right
  const floodAlertLegend = new FloodAlertLegendControl({ position: 'bottomright' });
  floodAlertLegend.addTo(this.map);
}


  private createFloodAlertObject(feature: any) {
    const riskCode = feature.properties.riskLevel.toString();

    if (riskCode.length !== 3) {
      throw new Error('Invalid riskLevel code. It must be a 3-digit number.');
    }

    const waterLevel = parseInt(riskCode.charAt(0));
    const trend = parseInt(riskCode.charAt(1));
    const freshness = parseInt(riskCode.charAt(2));
  
    let riskLevel = 'Normal';
  
    if (waterLevel === 1) {
      riskLevel = 'Low';
    } else if (waterLevel === 2) {
      riskLevel = 'Medium';
    } else if (waterLevel === 3) {
      riskLevel = 'Medium';
    } else if (waterLevel === 4 || waterLevel === 5 || waterLevel === 6) {
      riskLevel = 'High';
    } else if (waterLevel === 9) {
      riskLevel = 'No Data';
    }
  
    if (trend === 1) {
      riskLevel = 'Rising';
    } else if (trend === 2) {
      riskLevel = 'Falling';
    }
  
    if (freshness === 1) {
      riskLevel = 'Stale'; // Data older than 24 hours
    }
  
    const floodAlertObject: FloodAlert = {
      name: feature.properties.name,
      coords: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]], // For some reason this needs to be switched here...
      level: riskLevel
    };
    return floodAlertObject;
  }

  private addFloodAlerts() {
    this.floodAlerts.forEach((alert) => {
      if (alert.coords[0] && alert.coords[1]) {
        const marker = L.circleMarker(alert.coords, {
          radius: 8,
          fillColor: this.getAlertColor(alert.level),
          color: '#000',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8,
        });
        marker.bindPopup(`<strong>${alert.name}</strong><br>Risk Level: ${alert.level}`);
        marker.addTo(this.floodAlertLayer);
      }
    });
    this.floodAlertLayer.addTo(this.map);
  };

  private getAlertColor(level: string): string {
    switch (level) {
      case 'High':
        return '#FF0000';
      case 'Medium':
        return '#FFA500';
      case 'Low':
        return '#FFFF00';
      case 'Rising':
        return '#FF6347';
      case 'Falling':
        return '#32CD32';
      case 'Stale':
        return '#A9A9A9';
      default:
        return '#00FF00';
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
