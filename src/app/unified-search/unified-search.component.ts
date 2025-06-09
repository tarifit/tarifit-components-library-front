import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, switchMap, of, catchError } from 'rxjs';
import { UnifiedDictionaryService, UnifiedSearchResult, UnifiedStatistics } from '../services/unified-dictionary.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-unified-search',
  templateUrl: './unified-search.component.html',
  styleUrls: ['./unified-search.component.css']
})
export class UnifiedSearchComponent implements OnInit, OnDestroy {

  // Make Object available in template
  Object = Object;

  // Search state
  searchTerm: string = '';
  searchResults: UnifiedSearchResult[] = [];
  loading: boolean = false;
  hasSearched: boolean = false;

  // Source filters
  sources = {
    AQELEI: true,
    WARYAGHRI: true
  };

  // Statistics
  statistics: UnifiedStatistics | null = null;
  availableTypes: { [key: string]: string[] } = {};

  // Search configuration
  maxResults: number = 50;
  private destroy$ = new Subject<void>();

  // UI state
  showFilters: boolean = false;
  selectedResult: UnifiedSearchResult | null = null;
  favoriteStatus: { [key: string]: boolean } = {};
  isAuthenticated: boolean = false;

  constructor(
    private unifiedDictionaryService: UnifiedDictionaryService,
    private authService: AuthService
  ) {
    // Removed automatic search debouncing
  }

  ngOnInit(): void {
    this.isAuthenticated = this.authService.getCurrentAuthStatus();
    
    // Subscribe to auth changes
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuth => {
        this.isAuthenticated = isAuth;
        // Reload favorite statuses when auth changes
        if (isAuth && this.searchResults.length > 0) {
          this.loadFavoriteStatuses();
        } else if (!isAuth) {
          this.favoriteStatus = {};
        }
      });
    
    this.loadStatistics();
    this.loadAvailableTypes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Perform search manually (called by Enter key or Search button)
   */
  performSearch(): void {
    if (!this.searchTerm.trim()) {
      this.searchResults = [];
      this.hasSearched = false;
      return;
    }

    this.loading = true;
    const activeSources = Object.keys(this.sources)
      .filter(source => this.sources[source as keyof typeof this.sources]);

    this.unifiedDictionaryService.searchAcrossSources(
      this.searchTerm.trim(),
      activeSources,
      this.maxResults
    ).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.loading = false;
        this.hasSearched = true;
        this.loadFavoriteStatuses();
      },
      error: (error) => {
        console.error('Search error:', error);
        this.loading = false;
        this.searchResults = [];
        this.hasSearched = true;
      }
    });
  }

  /**
   * Handle Enter key press in search input
   */
  onSearchKeypress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.performSearch();
    }
  }

  /**
   * Handle source filter change
   */
  onSourceFilterChange(): void {
    // Re-search with new filters if there's a search term
    if (this.searchTerm.trim()) {
      this.performSearch();
    }
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.hasSearched = false;
    this.selectedResult = null;
  }

  /**
   * Get random entry
   */
  getRandomEntry(): void {
    this.loading = true;
    
    // Select random source from active ones
    const activeSources = Object.keys(this.sources)
      .filter(source => this.sources[source as keyof typeof this.sources]);
    
    const randomSource = activeSources.length > 0 ? 
      activeSources[Math.floor(Math.random() * activeSources.length)] : 
      undefined;

    this.unifiedDictionaryService.getRandomEntry(randomSource).subscribe({
      next: (result) => {
        this.searchResults = [result];
        this.searchTerm = result.word;
        this.hasSearched = true;
        this.loading = false;
        this.loadFavoriteStatuses();
      },
      error: (error) => {
        console.error('Random entry error:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Select a search result for detailed view
   */
  selectResult(result: UnifiedSearchResult): void {
    this.selectedResult = result;
  }

  /**
   * Close detailed view
   */
  closeDetailView(): void {
    this.selectedResult = null;
  }

  /**
   * Toggle favorite status for a result
   */
  toggleFavorite(result: UnifiedSearchResult, event: Event): void {
    event.stopPropagation();
    
    // Check if user is authenticated
    if (!this.isAuthenticated) {
      console.log('User must be authenticated to save favorites');
      return;
    }
    
    const globalId = result.globalId;
    const isFavorited = this.favoriteStatus[globalId];

    if (isFavorited) {
      // Remove from favorites
      this.unifiedDictionaryService.removeFromFavorites(
        result.source, 
        result.id || result.word
      ).subscribe({
        next: (response) => {
          if (response.removed) {
            this.favoriteStatus[globalId] = false;
          }
        },
        error: (error) => {
          console.error('Error removing favorite:', error);
        }
      });
    } else {
      // Add to favorites
      const request = {
        sourceCollection: this.getSourceCollectionName(result.source),
        entryId: result.id || result.word,
        entryWord: result.word,
        entryTranslation: result.translation,
        entryType: result.type
      };

      this.unifiedDictionaryService.addToFavorites(request).subscribe({
        next: (favorite) => {
          this.favoriteStatus[globalId] = true;
        },
        error: (error) => {
          console.error('Error adding favorite:', error);
        }
      });
    }
  }

  /**
   * Load statistics
   */
  private loadStatistics(): void {
    this.unifiedDictionaryService.getStatistics().subscribe({
      next: (stats) => {
        this.statistics = stats;
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
      }
    });
  }

  /**
   * Load available types
   */
  private loadAvailableTypes(): void {
    this.unifiedDictionaryService.getAvailableTypes().subscribe({
      next: (types) => {
        this.availableTypes = types;
      },
      error: (error) => {
        console.error('Error loading types:', error);
      }
    });
  }

  /**
   * Load favorite statuses for current results
   */
  private loadFavoriteStatuses(): void {
    // Only load favorites if user is authenticated
    if (!this.isAuthenticated) {
      this.favoriteStatus = {};
      return;
    }
    
    this.searchResults.forEach(result => {
      const sourceCollection = this.getSourceCollectionName(result.source);
      const entryId = result.id || result.word;
      
      this.unifiedDictionaryService.isEntryFavorited(sourceCollection, entryId)
        .pipe(
          catchError(error => {
            console.error('Error checking favorite status:', error);
            return of({ isFavorited: false });
          })
        )
        .subscribe({
          next: (response) => {
            this.favoriteStatus[result.globalId] = response.isFavorited;
          }
        });
    });
  }

  /**
   * Get source collection name for API calls
   */
  private getSourceCollectionName(source: string): string {
    switch (source) {
      case 'AQELEI': return 'dictionary_aqelɛi';
      case 'WARYAGHRI': return 'dictionary_waryaghri';
      default: return source.toLowerCase();
    }
  }

  /**
   * Get CSS class for source badge
   */
  getSourceBadgeClass(source: string): string {
    switch (source) {
      case 'AQELEI': return 'badge-aqelei';
      case 'WARYAGHRI': return 'badge-waryaghri';
      default: return 'badge-default';
    }
  }

  /**
   * Get match type display text
   */
  getMatchTypeDisplay(matchType: string): string {
    switch (matchType) {
      case 'exact_word': return 'Exact word match';
      case 'exact_translation': return 'Exact translation match';
      case 'starts_word': return 'Word starts with query';
      case 'starts_translation': return 'Translation starts with query';
      case 'contains_word': return 'Word contains query';
      case 'contains_translation': return 'Translation contains query';
      case 'fuzzy_match': return 'Similar match';
      case 'random': return 'Random entry';
      default: return 'Match found';
    }
  }

  /**
   * Check if any source is selected
   */
  hasActiveSource(): boolean {
    return Object.values(this.sources).some(active => active);
  }

  /**
   * Get search results summary text
   */
  getResultsSummary(): string {
    if (!this.hasSearched) {
      return 'Enter a search term to find entries across all dictionaries';
    }
    
    if (this.loading) {
      return 'Searching...';
    }
    
    if (this.searchResults.length === 0) {
      return `No results found for "${this.searchTerm}"`;
    }
    
    const activeSources = Object.keys(this.sources)
      .filter(source => this.sources[source as keyof typeof this.sources]);
    
    return `${this.searchResults.length} results for "${this.searchTerm}" in ${activeSources.join(', ')}`;
  }

  /**
   * Track by function for ngFor performance
   */
  trackByGlobalId(index: number, result: UnifiedSearchResult): string {
    return result.globalId;
  }

  /**
   * Toggle filters panel
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  /**
   * Get dictionary sources only (exclude verbs)
   */
  getDictionarySourcesOnly(): string[] {
    if (!this.statistics) return [];
    return Object.keys(this.statistics.entriesBySource)
      .filter(source => source !== 'Verbs');
  }

  /**
   * Get total dictionary entries (exclude verbs)
   */
  getTotalDictionaryEntries(): string {
    if (!this.statistics) return '0';
    const total = Object.keys(this.statistics.entriesBySource)
      .filter(source => source !== 'Verbs')
      .reduce((sum, source) => sum + (this.statistics!.entriesBySource[source] || 0), 0);
    return total.toLocaleString();
  }
}
