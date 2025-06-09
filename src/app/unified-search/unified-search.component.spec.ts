import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { UnifiedSearchComponent } from './unified-search.component';
import { UnifiedDictionaryService } from '../services/unified-dictionary.service';

describe('UnifiedSearchComponent', () => {
  let component: UnifiedSearchComponent;
  let fixture: ComponentFixture<UnifiedSearchComponent>;
  let mockUnifiedDictionaryService: jasmine.SpyObj<UnifiedDictionaryService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('UnifiedDictionaryService', [
      'searchAcrossSources',
      'getRandomEntry',
      'getStatistics',
      'getAvailableTypes',
      'addToFavorites',
      'removeFromFavorites',
      'isEntryFavorited'
    ]);

    await TestBed.configureTestingModule({
      declarations: [ UnifiedSearchComponent ],
      imports: [ HttpClientTestingModule, FormsModule ],
      providers: [
        { provide: UnifiedDictionaryService, useValue: spy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnifiedSearchComponent);
    component = fixture.componentInstance;
    mockUnifiedDictionaryService = TestBed.inject(UnifiedDictionaryService) as jasmine.SpyObj<UnifiedDictionaryService>;
    
    // Setup default mock responses
    mockUnifiedDictionaryService.getStatistics.and.returnValue(of({
      totalEntries: 10000,
      entriesBySource: { 'Aqelɛi': 5000, 'Waryaghri': 3000, 'Verbs': 2000 },
      availableTypes: { 'Aqelɛi': ['noun', 'verb'], 'Waryaghri': ['nom', 'verbe'], 'Verbs': ['verbe'] }
    }));
    
    mockUnifiedDictionaryService.getAvailableTypes.and.returnValue(of({
      'Aqelɛi': ['noun', 'verb'],
      'Waryaghri': ['nom', 'verbe'],
      'Verbs': ['verbe']
    }));
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load statistics on init', () => {
    expect(mockUnifiedDictionaryService.getStatistics).toHaveBeenCalled();
    expect(component.statistics).toBeTruthy();
  });

  it('should perform search when search term changes', () => {
    const mockResults = [{
      id: '1',
      source: 'AQELEI',
      sourceDisplayName: 'Aqelɛi',
      word: 'test',
      translation: 'test translation',
      type: 'noun',
      relevanceScore: 0,
      matchType: 'exact_word',
      highlightedText: null,
      globalId: 'dictionary_aqelɛi:1'
    }];
    
    mockUnifiedDictionaryService.searchAcrossSources.and.returnValue(of(mockResults));
    
    component.searchTerm = 'test';
    component.onSearchChange();
    
    setTimeout(() => {
      expect(mockUnifiedDictionaryService.searchAcrossSources).toHaveBeenCalledWith(
        'test', 
        ['AQELEI', 'WARYAGHRI', 'VERBS'], 
        50
      );
      expect(component.searchResults).toEqual(mockResults);
    }, 400); // Wait for debounce
  });

  it('should clear search results when search is cleared', () => {
    component.searchResults = [/* some results */];
    component.hasSearched = true;
    
    component.clearSearch();
    
    expect(component.searchTerm).toBe('');
    expect(component.searchResults).toEqual([]);
    expect(component.hasSearched).toBeFalse();
  });

  it('should get random entry', () => {
    const mockRandomEntry = {
      id: '1',
      source: 'VERBS',
      sourceDisplayName: 'Verbs',
      word: 'random',
      translation: 'random translation',
      type: 'verbe',
      relevanceScore: 0,
      matchType: 'random',
      highlightedText: null,
      globalId: 'verbs:1'
    };
    
    mockUnifiedDictionaryService.getRandomEntry.and.returnValue(of(mockRandomEntry));
    
    component.getRandomEntry();
    
    expect(mockUnifiedDictionaryService.getRandomEntry).toHaveBeenCalled();
  });
});
