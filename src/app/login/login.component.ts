// src/app/login/login.component.ts - FIXED WITH FORGOT PASSWORD
import {Component, EventEmitter, Output} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {AuthService} from "../auth/auth.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'] // Will be emptied - using Bootstrap classes only
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage: string | null = null;
  loading: boolean = false;

  @Output() switchToRegister = new EventEmitter<void>();
  @Output() switchToForgotPassword = new EventEmitter<void>(); // NEW: Add this output
  @Output() loginSuccess = new EventEmitter<void>();

  constructor(
    private authService: AuthService
  ) { }

  login(): void {
    this.errorMessage = null;
    this.loading = true;

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        this.loading = false;
        this.loginSuccess.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.error?.message || 'Login failed. Please try again.';
        this.loading = false;
        console.error('Login error:', err);
      }
    });
  }

  onSwitchToRegister(): void {
    this.switchToRegister.emit();
  }

  onForgotPassword(): void {
    console.log('Forgot password clicked!'); // Debug log
    this.switchToForgotPassword.emit(); // NEW: Emit the event
  }
}
