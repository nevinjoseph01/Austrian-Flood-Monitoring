import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser'; // Import DomSanitizer

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'feed.component.html',
  styleUrls: ['feed.component.css']
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
