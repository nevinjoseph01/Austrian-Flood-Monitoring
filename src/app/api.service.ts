import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'https://floodmonitor-backend.fly.dev/api'; // Base URL for API

  constructor(private http: HttpClient) {}

  // Registration method
  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/register`, userData);
  }

  // Email verification method
  verifyEmail(verificationData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/verify-email`, verificationData);
  }

  // Login method
  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, credentials);
  }

  // Store user credentials in localStorage
  storeUserCredentials(userId: string, userRole: string, username: string) {
    localStorage.setItem('userId', userId);
    localStorage.setItem('userRole', userRole);
    localStorage.setItem('username', username);
  }

  // Retrieve user credentials from localStorage
  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  getUserRole(): string | null {
    return localStorage.getItem('userRole');
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  // Logout method
  logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
  }

  // Method to make authenticated requests
  getAuthHeaders(): HttpHeaders {
    const userId = this.getUserId();
    const userRole = this.getUserRole();
    let headers = new HttpHeaders();

    if (userId && userRole) {
      headers = headers.set('x-user-id', userId).set('x-user-role', userRole);
    }

    return headers;
  }

  // Get all reports
  getReports(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/reports`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Create a new report
  createReport(reportData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/reports`, reportData, {
      headers: this.getAuthHeaders(),
    });
  }

  // Get all tasks
  getTasks(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/tasks`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Create a new task
  createTask(taskData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/tasks`, taskData, {
      headers: this.getAuthHeaders(),
    });
  }

  // Update User Location
  updateLocation(userId: string, locationData: [number, number]): Observable<any> {
    console.log('Sending location data to API:', locationData); // Log the data being sent
    const [latitude, longitude] = locationData;
    const formattedData = { latitude, longitude }; // Convert array to object

    let headers = this.getAuthHeaders();
    console.log('Headers being sent:', headers);

    return this.http.put<any>(`${this.baseUrl}/users/${userId}/location`, formattedData, {
        headers,
    });
  }


  getUsernames(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/users`);
  }
}
