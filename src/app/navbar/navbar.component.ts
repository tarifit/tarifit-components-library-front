import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {AuthService} from '../auth/auth.service';
import {UserService, CompleteProfileResponse} from '../services/user.service';
import {UserRole} from '../services/questionnaire.models';
import {takeUntil} from "rxjs/operators";
import {Subject} from "rxjs";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {

  @Input() selectedTab: string = '';
  @Output() tabChange = new EventEmitter<string>();
  isUserAuthenticated = false;
  mobileMenuOpen = false;
  private destroy$ = new Subject<void>();
  
  // User role management
  userProfile: CompleteProfileResponse | null = null;
  isAdmin = false;

  // ADD these @Output events:
  @Output() openLogin = new EventEmitter<void>();
  @Output() openRegister = new EventEmitter<void>();

  constructor(
    public authService: AuthService,
    private userService: UserService // ADD: Inject UserService
  ) {}

  ngOnInit(): void {
    console.log('🔍 Navbar Init - Current auth status:', this.authService.getCurrentAuthStatus());
    this.isUserAuthenticated = this.authService.getCurrentAuthStatus();

    // Subscribe to auth changes
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuth => {
        this.isUserAuthenticated = isAuth;
        console.log('🔍 Navbar: Auth status changed to:', isAuth);
        
        // Load user profile when authenticated
        if (isAuth) {
          this.loadUserProfile();
        } else {
          this.userProfile = null;
          this.isAdmin = false;
        }
      });
      
    // Load user profile if already authenticated
    if (this.isUserAuthenticated) {
      this.loadUserProfile();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private loadUserProfile(): void {
    this.userService.getCompleteProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.isAdmin = profile.userRole === UserRole.ADMIN;
        console.log('🔍 Navbar: User profile loaded, isAdmin:', this.isAdmin);
      },
      error: (error) => {
        console.error('Error loading user profile in navbar:', error);
        this.isAdmin = false;
      }
    });
  }

  // SPA Navigation - No routing, just emit feature changes
  changeTab(feature: string): void {
    console.log('🔍 Navbar: Changing to feature:', feature);
    this.selectedTab = feature;
    this.tabChange.emit(feature);
    this.closeMobileMenu();
  }

  // Navigate for guest users - same as authenticated, no routing
  navigateGuest(feature: string): void {
    const featureMap: { [key: string]: string } = {
      'translation': 'tarifit-english',
      'dictionary': 'dictionary-waryaghri',
      'dictionary-aqelei': 'dictionary-aqelei',
      'conjugation': 'verbs',
      'massin': 'massin',
      'french': 'tarifit-french',
      'darija': 'tarifit-darija',
      'unified-search': 'unified-search'
    };

    const mappedFeature = featureMap[feature] || feature;
    console.log('🔍 Navbar: Guest navigating to feature:', mappedFeature);
    this.selectedTab = mappedFeature;
    this.tabChange.emit(mappedFeature);
    this.closeMobileMenu();
  }

  // Check if guest page is active - now based on selectedTab
  isGuestPageActive(feature: string): boolean {
    const featureMap: { [key: string]: string } = {
      'translation': 'tarifit-english',
      'dictionary': 'dictionary-waryaghri',
      'dictionary-aqelei': 'dictionary-aqelei',
      'conjugation': 'verbs',
      'massin': 'massin',
      'french': 'tarifit-french',
      'darija': 'tarifit-darija',
      'unified-search': 'unified-search'
    };

    const mappedFeature = featureMap[feature] || feature;
    return this.selectedTab === mappedFeature;
  }

  // Go to home - SPA style
  goHome(): void {
    console.log('🔍 Navbar: Going home');
    // If user is not authenticated, take them to unified search as a showcase
    if (!this.isUserAuthenticated) {
      this.selectedTab = 'unified-search';
      this.tabChange.emit('unified-search');
    } else {
      this.selectedTab = 'home';
      this.tabChange.emit('home');
    }
    this.closeMobileMenu();
  }

  login(): void {
    console.log('🔍 Navbar: Opening login modal');
    this.openLogin.emit(); // Tell app component to open login modal
    this.closeMobileMenu();
  }

  register(): void {
    console.log('🔍 Navbar: Opening register modal');
    this.openRegister.emit(); // Tell app component to open register modal
    this.closeMobileMenu();
  }

  logout(): void {
    console.log('🔍 Navbar: Logging out');
    this.authService.logout();
    this.closeMobileMenu();
  }

  goToProfile(): void {
    console.log('🔍 Navbar: Going to profile');
    this.changeTab('profile');
  }

  goToPreferences(): void {
    console.log('🔍 Navbar: Going to preferences');
    this.changeTab('preferences');
  }

  // Mobile menu functionality
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  // Helper methods to determine active dropdown states
  isDictionaryActive(): boolean {
    return this.selectedTab === 'dictionary-waryaghri' || 
           this.selectedTab === 'dictionary-aqelei' ||
           this.selectedTab === 'unified-search';
  }

  isTranslationActive(): boolean {
    return this.selectedTab === 'tarifit-english' || 
           this.selectedTab === 'tarifit-french' || 
           this.selectedTab === 'tarifit-darija' ||
           this.selectedTab === 'massin';
  }

  isLanguageToolsActive(): boolean {
    return this.selectedTab === 'verbs' || 
           this.selectedTab === 'sentence-translation' ||
           this.selectedTab === 'word-relationships';
  }

  isLearningActive(): boolean {
    return this.selectedTab === 'learning' || 
           this.selectedTab === 'personal-analytics' ||
           this.selectedTab === 'admin-analytics';
  }

  isCommunityActive(): boolean {
    return this.selectedTab === 'leaderboard' || 
           this.selectedTab === 'verify-translations';
  }
}
