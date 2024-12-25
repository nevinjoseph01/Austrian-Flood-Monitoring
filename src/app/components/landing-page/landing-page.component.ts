// src/app/components/landing-page/landing-page.component.ts

import { 
  Component, 
  OnInit, 
  AfterViewInit, 
  ViewChild, 
  ElementRef, 
  HostListener 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { GeoJSON } from 'geojson';
import * as turf from '@turf/turf';
import { HttpClient } from '@angular/common/http';
import proj4 from "proj4";

// Sample fetch function for water data
import { getWaterData } from '../../../assets/fetch';

interface FloodAlert {
  name: string;
  coords: [number, number]; // [lat, lng]
  level: string;
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: 'landing-page.component.html',
  styleUrls: ['landing-page.component.css']
})
export class LandingPageComponent implements OnInit, AfterViewInit {
  @ViewChild('mapSection') mapSection!: ElementRef;
  @ViewChild('welcomeSection') welcomeSection!: ElementRef;

  constructor(private http: HttpClient) {}

  private map!: L.Map;
  private waterLevelLayer!: L.GeoJSON<any>;
  private histWaterLevelLayer!: L.GeoJSON<any>;
  private floodAlertLayer!: L.LayerGroup<any>;
  private floodAlerts: FloodAlert[] = [];

  ngOnInit(): void {
    // Optional: any initialization logic
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.addLegends();
    this.addScaleControl();
    this.addMapClickListener();

    // Fetch data once
    this.fetchAndUpdateWaterData();

    // (Optional) Periodic refresh every 10 minutes
    this.setupPeriodicDataFetch();
  }

  // ----------------- KEYBOARD NAVIGATION -----------------
  /**
   * Listen for arrow key presses.
   * ArrowDown => scrollToWelcome()
   * ArrowUp   => scrollToMap()
   */
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      // If user presses down arrow, go to welcome section
      event.preventDefault();
      this.scrollToWelcome();
    } else if (event.key === 'ArrowUp') {
      // If user presses up arrow, go back to map section
      event.preventDefault();
      this.scrollToMap();
    }
  }

  // ----------------- ARROW CLICK HANDLERS -----------------
  /**
   * Scroll to the welcome section
   */
  scrollToWelcome(): void {
    this.welcomeSection.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Scroll back to the map section
   */
  scrollToMap(): void {
    this.mapSection.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  // ----------------- MAP INITIALIZATION -----------------
  private initMap(): void {
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
  }

  private addScaleControl(): void {
    L.control.scale().addTo(this.map);
  }

  private addMapClickListener(): void {
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      L.popup()
        .setLatLng(e.latlng)
        .setContent(`Lat: ${e.latlng.lat.toFixed(5)}, Lng: ${e.latlng.lng.toFixed(5)}`)
        .openOn(this.map);
    });
  }

  // ----------------- LEGENDS -----------------
  private addLegends(): void {
    // 1) Water Level Legend
    class WaterLevelLegendControl extends L.Control {
      override onAdd(map: L.Map) {
        const div = L.DomUtil.create('div', 'info legend');
        const grades = [0, 50, 300, 600, 900, 1200, 1500];
        div.innerHTML += '<strong>Water Level (m)</strong><br>';

        const getColor = (val: number) => {
          return val > 1500
            ? '#062C67'
            : val > 1200
            ? '#1B4F8A'
            : val > 900
            ? '#3473A6'
            : val > 600
            ? '#5A94C3'
            : val > 300
            ? '#86B4D4'
            : val > 50
            ? '#ABCDE5'
            : '#D3E7F8';
        };

        for (let i = 0; i < grades.length; i++) {
          div.innerHTML +=
            `<i style="background:${getColor(grades[i] + 1)}"></i> ${grades[i]}` +
            (grades[i + 1] ? `&ndash;${grades[i + 1]}<br>` : '+');
        }
        return div;
      }
    }
    const waterLevelLegend = new WaterLevelLegendControl({ position: 'bottomright' });
    waterLevelLegend.addTo(this.map);

    // 2) Flood Alert Legend
    class FloodAlertLegendControl extends L.Control {
      override onAdd(map: L.Map) {
        const div = L.DomUtil.create('div', 'info legend flood-alert-legend');
        div.innerHTML = `
          <strong>Flood Alerts</strong><br>
          <i style="background: #FF0000"></i> High Alert<br>
          <i style="background: #FFA500"></i> Medium Alert<br>
          <i style="background: #FFFF00"></i> Low Alert<br>
          <i style="background: #FF6347"></i> Rising<br>
          <i style="background: #32CD32"></i> Falling<br>
          <i style="background: #A9A9A9"></i> Stale<br>
        `;
        return div;
      }
    }
    const floodAlertLegend = new FloodAlertLegendControl({ position: 'bottomleft' });
    floodAlertLegend.addTo(this.map);
  }

  // ----------------- DATA FETCHING -----------------
  private async fetchAndUpdateWaterData(): Promise<void> {
    try {
      const data = await this.loadWaterLevelData();
      this.processWaterData(data);
    } catch (error) {
      console.error('Error fetching water level data:', error);
    }
  }

  private setupPeriodicDataFetch(): void {
    setInterval(async () => {
      try {
        const data = await this.loadWaterLevelData();
        this.processWaterData(data);
      } catch (error) {
        console.error('Error fetching water level data:', error);
      }
    }, 10 * 60 * 1000); // every 10 minutes
  }

  private loadWaterLevelData(): Promise<GeoJSON.FeatureCollection> {
    // Calls your fetch function. Adjust if needed.
    return getWaterData();
  }

  private processWaterData(data: GeoJSON.FeatureCollection): void {
    // Remove existing layer if it exists
    if (this.waterLevelLayer) {
      this.map.removeLayer(this.waterLevelLayer);
    }

    // Create new water level layer
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
      onEachFeature: (feature: any, layer: L.Layer) => {
        if (feature.properties?.name) {
          const alert = this.createFloodAlertObject(feature);
          if (alert) this.floodAlerts.push(alert);

          layer.bindPopup(`
            <strong>${feature.properties.name}</strong><br>
            Water Level: ${feature.properties.waterLevel}m<br>
            Closest body of water: ${feature.properties.area}<br>
            Last available data: ${feature.properties.timeStamp}<br>
            More details <a href='${feature.properties.detailsLink}' target='_blank'>here</a><br>
          `);
        }
      }
    }).addTo(this.map);

    // Load and display historical data (this one here probably takes a long time)
    this.updateFloodAlerts();

    for(var i = 0; i < 77; i++)
    {
      /*this.setupHistWaterData(i);*/
      if(i == 76)
      {
        this.addLayerControl();
      }
    }
  }

  // ------------- HISTORICAL WATER DATA ------------

  private async setupHistWaterData(file_counter: number): Promise<void> {
    try {
      //this.loadHistWaterLevelData().subscribe((data) => {
      if (this.histWaterLevelLayer) {
        this.map.removeLayer(this.histWaterLevelLayer);
      }

      // Original GeoJSON object
      this.http.get<GeoJSON.FeatureCollection>(`assets/HistWater_${file_counter}.geojson`).subscribe((data: GeoJSON.FeatureCollection) => {
        const simplifiedData = turf.simplify(data, { tolerance: 0.01 });
        this.processHistWaterData(simplifiedData);
      });

      

    } catch (error) {
      console.error('Error fetching historical water level data:', error);
    }
  }

  // Reproject GeoJSON coordinates from EPSG:3035 to EPSG:4326
  private processHistWaterData(data: GeoJSON.FeatureCollection) {
    // Define EPSG:3035 projection
    proj4.defs(
      "EPSG:3035",
      "+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs"
    );

    const reprojectedGeoJSON: GeoJSON.FeatureCollection = {
      ...data,
      features: data.features.map((feature) => {
        if (feature.geometry.type === "Polygon") {
          // Reproject Polygon coordinates
          const reprojectedCoordinates = feature.geometry.coordinates.map((ring) =>
            ring.map((coord) => {
              const [x, y] = proj4("EPSG:3035", "EPSG:4326", [coord[1], coord[0]]); // Swap before reprojection
              return [x, y]; // Flip back after reprojection
            })
          );
          return {
            ...feature,
            geometry: {
              ...feature.geometry,
              coordinates: reprojectedCoordinates,
            },
          };
        } else if (feature.geometry.type === "MultiPolygon") {
          // Reproject MultiPolygon coordinates
          const reprojectedCoordinates = feature.geometry.coordinates.map((polygon) =>
            polygon.map((ring) =>
              ring.map((coord) => {
                const [x, y] = proj4("EPSG:3035", "EPSG:4326", [coord[1], coord[0]]); // Swap before reprojection
                return [y, x]; // Flip back after reprojection
              })
            )
          );
          return {
            ...feature,
            geometry: {
              ...feature.geometry,
              coordinates: reprojectedCoordinates,
            },
          };
        }
        // Return the feature unchanged if it's not a Polygon or MultiPolygon
        return feature;
      }) as GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>[], // Explicitly cast to the correct type
    };

    // Add reprojected GeoJSON to the map
    this.histWaterLevelLayer = L.geoJSON(reprojectedGeoJSON, {
      style: (feature) => ({
        color: "red", // Set the outline color
        weight: 2, // Set the outline width
        fillColor: "orange", // Set the fill color
        fillOpacity: 0.5, // Set the fill transparency
      }),
      onEachFeature: (feature, layer) => {
        // Bind a popup with properties
        console.log(feature.properties.returnPeriod);
        const { gml_id, localId, returnPeriod } = feature.properties;
        layer.bindPopup(`
          <strong>${gml_id}</strong><br>
          Local ID: ${localId}<br>
          Return Period: ${returnPeriod}
        `);
      },
    }).addTo(this.map);
  }

  // ----------------- FLOOD ALERTS -----------------
  private createFloodAlertObject(feature: any): FloodAlert | null {
    const riskCode = feature.properties.riskLevel?.toString();
    if (!riskCode || riskCode.length !== 3) return null;

    const waterLevelNum = parseInt(riskCode.charAt(0), 10);
    const trend = parseInt(riskCode.charAt(1), 10);
    const freshness = parseInt(riskCode.charAt(2), 10);

    let riskLevel = 'Normal';
    if (waterLevelNum === 1) riskLevel = 'Low';
    else if (waterLevelNum === 2 || waterLevelNum === 3) riskLevel = 'Medium';
    else if (waterLevelNum >= 4 && waterLevelNum <= 6) riskLevel = 'High';
    else if (waterLevelNum === 9) riskLevel = 'No Data';

    if (trend === 1) riskLevel = 'Rising';
    else if (trend === 2) riskLevel = 'Falling';

    if (freshness === 1) riskLevel = 'Stale';

    return {
      name: feature.properties.name,
      coords: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
      level: riskLevel
    };
  }

  private updateFloodAlerts(): void {
    if (this.floodAlertLayer) {
      this.map.removeLayer(this.floodAlertLayer);
    }
    this.floodAlertLayer = L.layerGroup();

    this.floodAlerts.forEach((alert) => {
      if (alert.coords[0] && alert.coords[1]) {
        const marker = L.circleMarker(alert.coords, {
          radius: 8,
          fillColor: this.getAlertColor(alert.level),
          color: '#000',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        });
        marker.bindPopup(`
          <strong>${alert.name}</strong><br>
          Risk Level: ${alert.level}
        `);
        this.floodAlertLayer.addLayer(marker);
      }
    });

    this.floodAlertLayer.addTo(this.map);
  }

  // ----------------- LAYER CONTROL -----------------
  private addLayerControl(): void {
    const overlayMaps = {
      'Water Levels': this.waterLevelLayer,
      'Flood Alerts': this.floodAlertLayer
    };
    L.control.layers({}, overlayMaps).addTo(this.map);
  }

  // ----------------- COLOR HELPERS -----------------
  private getColor(waterLevel: number): string {
    if (waterLevel > 1500) return '#062C67';
    if (waterLevel > 1200) return '#1B4F8A';
    if (waterLevel > 900)  return '#3473A6';
    if (waterLevel > 600)  return '#5A94C3';
    if (waterLevel > 300)  return '#86B4D4';
    if (waterLevel > 50)   return '#ABCDE5';
    return '#D3E7F8';
  }

  private getAlertColor(level: string): string {
    switch (level) {
      case 'High':    return '#FF0000';
      case 'Medium':  return '#FFA500';
      case 'Low':     return '#FFFF00';
      case 'Rising':  return '#FF6347';
      case 'Falling': return '#32CD32';
      case 'Stale':   return '#A9A9A9';
      case 'No Data': return '#808080';
      default:        return '#00FF00';
    }
  }
}
