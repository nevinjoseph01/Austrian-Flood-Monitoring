import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // Ensure ReactiveFormsModule is included here
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css'],
})
export class EditProfileComponent implements OnInit {
  editProfileForm!: FormGroup;
  userId: string | null = null;
  currentLocation: string = '';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize the form
    this.editProfileForm = this.fb.group({
      location: [''], // Default empty value
    });

    // Get user ID and current location
    this.userId = this.apiService.getUserId();
    if (this.userId) {
      this.apiService.getUsernames().subscribe((response) => {
        // Fetch the location (assuming you have an API that gets user data)
        const user = response.usernames.find((u: any) => u.id === this.userId);
        this.currentLocation = user?.location || '';
        this.editProfileForm.patchValue({ location: this.currentLocation });
      });
    }
  }

  // Submit form to update location
  onSubmit(): void {
    if (this.editProfileForm.valid && this.userId) {
      const location = this.editProfileForm.value.location;

      this.apiService.updateLocation(this.userId, location).subscribe(
        (response) => {
          alert('Location updated successfully!');
          this.router.navigate(['/']); // Redirect to home or another page
        },
        (error) => {
          console.error('Error updating location:', error);
          alert('Failed to update location.');
        }
      );
    }
  }
}
