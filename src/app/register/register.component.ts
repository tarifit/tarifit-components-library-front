// src/app/register/register.component.ts - UPDATED FOR MODAL
import {Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {NgForm} from '@angular/forms';
import {HttpErrorResponse} from '@angular/common/http';
import {AuthService} from "../auth/auth.service";

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';

  errorMessage: string | null = null;
  successMessage: string | null = null;
  loading: boolean = false;

  @Output() switchToLogin = new EventEmitter<void>();
  @Output() registerSuccess = new EventEmitter<void>(); // New output for successful registration

  @ViewChild('registerForm') registerForm!: NgForm;

  constructor(private authService: AuthService) { }

  register(): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.loading = true;

    // Client-side validation check
    if (this.registerForm.invalid) {
      this.errorMessage = 'Please fill in all required fields and correct any errors.';
      this.loading = false;
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      this.loading = false;
      return;
    }

    this.authService.register({ username: this.username, email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.successMessage = res; // Backend returns the success message directly
        this.errorMessage = null;
        this.loading = false;
        this.registerForm.resetForm(); // Clear the form after successful registration

        // Show success message for 3 seconds, then switch to login
        setTimeout(() => {
          this.registerSuccess.emit(); // This will switch to login
        }, 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.error || 'Registration failed. Please try again.';
        this.successMessage = null;
        this.loading = false;
        console.error('Registration error:', err);
      }
    });
  }

  onSwitchToLogin(): void {
    this.switchToLogin.emit();
  }
}
