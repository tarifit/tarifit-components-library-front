import {Component, EventEmitter, Output} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {finalize} from 'rxjs/operators';
import {environment} from "../../environments/environment";

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  @Output() switchToLogin = new EventEmitter<void>(); // Keep this for navigation

  email: string = '';
  message: string = '';
  isSuccess: boolean | null = null;
  loading: boolean = false;
  private baseUrl = environment.apiBaseUrl + '/api/auth';

  constructor(private http: HttpClient) {}

  requestPasswordReset(): void {
    console.log('Password reset requested for:', this.email); // Debug log

    if (!this.email) {
      this.message = 'Please enter your email address.';
      this.isSuccess = false;
      return;
    }

    this.loading = true;
    this.message = 'Sending password reset link...';
    this.isSuccess = null;

    this.http.post(`${this.baseUrl}/forgot-password`, { email: this.email }, { responseType: 'text' })
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (response: string) => {
          console.log('Password reset response:', response); // Debug log
          this.message = response || 'Password reset link sent to your email if the account exists.';
          this.isSuccess = true;
          this.email = ''; // Clear email input
        },
        error: (error: HttpErrorResponse) => {
          console.error('Password reset error:', error); // Debug log
          this.message = error.error || 'Failed to send password reset link. Please try again.';
          this.isSuccess = false;
        }
      });
  }

  onBackToLogin(): void {
    console.log('Back to login clicked'); // Debug log
    this.switchToLogin.emit();
  }
}
