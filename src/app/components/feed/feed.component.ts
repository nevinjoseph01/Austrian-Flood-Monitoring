import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser'; // Import DomSanitizer

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="feed-container">
      <h2>Your Feed</h2>
      <div *ngIf="reports.length === 0">
        <p>No reports to display.</p>
      </div>
      <div *ngFor="let report of reports" class="report-card">
        <h3>{{ report.title }}</h3>
        <p>{{ report.description }}</p>

        <!-- Display media if available -->
        <div *ngIf="report.media && report.media.length > 0" class="media-gallery">
          <div *ngFor="let mediaItem of report.media">
            <ng-container [ngSwitch]="getMediaType(mediaItem.mimetype)">
              <!-- Image -->
              <img
                *ngSwitchCase="'image'"
                [src]="getMediaUrl(mediaItem.path)"
                alt="Image"
                class="media-item"
              />
              <!-- Video -->
              <video
                *ngSwitchCase="'video'"
                [src]="getMediaUrl(mediaItem.path)"
                controls
                class="media-item"
              ></video>
              <!-- PDF -->
              <a
                *ngSwitchCase="'pdf'"
                [href]="getMediaUrl(mediaItem.path)"
                target="_blank"
                class="media-item pdf-link"
              >
                View PDF
              </a>
              <!-- Unsupported -->
              <p *ngSwitchDefault>Unsupported media type</p>
            </ng-container>
          </div>
        </div>

        <p class="meta">
          Posted by {{ report.createdBy.username }} on {{ report.createdAt | date: 'medium' }}
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      .feed-container {
        max-width: 800px;
        margin: 50px auto;
        padding: 20px;
        background-color: #1a1a1a;
        border-radius: 10px;
        color: #f1c40f;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      h2 {
        text-align: center;
        margin-bottom: 30px;
      }

      .report-card {
        background-color: #333;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
      }

      .report-card h3 {
        margin-top: 0;
      }

      .meta {
        font-size: 0.8em;
        color: #b3b3b3;
      }

      .media-gallery {
        margin: 15px 0;
      }

      .media-item {
        max-width: 100%;
        max-height: 400px;
        margin-bottom: 10px;
        display: block;
      }

      .pdf-link {
        color: #f1c40f;
        text-decoration: underline;
        cursor: pointer;
      }

      .pdf-link:hover {
        color: #e0e0e0;
      }
    `,
  ],
})
export class FeedComponent implements OnInit {
  reports: any[] = [];

  constructor(private apiService: ApiService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports() {
    this.apiService.getReports().subscribe(
      (data) => {
        this.reports = data.reports;
      },
      (error) => {
        console.error('Error fetching reports:', error);
      }
    );
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
