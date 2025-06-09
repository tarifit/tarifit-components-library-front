// src/app/auth-modal/auth-modal.component.ts
import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Subject} from 'rxjs';

@Component({
  selector: 'app-auth-modal',
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.css']
})
export class AuthModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @Input() isVisible = false; // Controls modal visibility
  @Input() currentTab: 'login' | 'register' | 'forgot-password' = 'login'; // Updated to include forgot-password
  @Output() modalClose = new EventEmitter<void>(); // Emit when modal closes

  ngOnInit(): void {
    console.log('AuthModal: Component initialized');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Open modal methods
  openLoginModal(): void {
    this.currentTab = 'login';
    this.isVisible = true;
  }

  openRegisterModal(): void {
    this.currentTab = 'register';
    this.isVisible = true;
  }

  openForgotPasswordModal(): void {
    this.currentTab = 'forgot-password';
    this.isVisible = true;
  }

  // Close modal
  closeModal(): void {
    this.isVisible = false;
    this.modalClose.emit(); // Emit close event to parent
    console.log('AuthModal: Modal closed');
  }

  // Switch between tabs
  switchToLogin(): void {
    console.log('AuthModal: Switching to login tab');
    this.currentTab = 'login';
  }

  switchToRegister(): void {
    console.log('AuthModal: Switching to register tab');
    this.currentTab = 'register';
  }

  switchToForgotPassword(): void {
    console.log('AuthModal: Switching to forgot password tab');
    this.currentTab = 'forgot-password';
  }

  // Event handlers
  onBackdropClick(event: MouseEvent): void {
    this.closeModal();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeModal();
    }
  }

  // Handle successful login/register
  onLoginSuccess(): void {
    console.log('AuthModal: Login successful, closing modal');
    this.closeModal();
  }

  onRegisterSuccess(): void {
    console.log('AuthModal: Registration successful, switching to login');
    this.switchToLogin();
  }
}
