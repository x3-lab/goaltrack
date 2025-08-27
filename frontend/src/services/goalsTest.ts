import { goalsApi } from './goalsApi';
import type { Goal, CreateGoalRequest } from '../types/api';

export class GoalsTestSuite {
  private results: Array<{ test: string; success: boolean; error?: string }> = [];

  async runAllTests(): Promise<void> {
    console.log('🎯 Starting Goals Management Integration Tests...');
    console.log('🔧 Testing both online and offline modes...');
    
    // Test goals CRUD operations
    await this.testGoalsCRUDOperations();
    
    // Test progress tracking
    await this.testProgressTracking();
    
    // Test filtering and search
    await this.testGoalsFiltering();
    
    // Test statistics
    await this.testGoalsStatistics();
    
    // Test error handling
    await this.testErrorHandling();
    
    // Test API compatibility
    await this.testAPICompatibility();
    
    // Display results
    this.displayResults();
  }

  private async testGoalsCRUDOperations(): Promise<void> {
    try {
      // Test get all goals (compatibility method)
      const goals = await goalsApi.getAll();
      this.addResult('Get all goals (array)', Array.isArray(goals), 
        goals ? `Returned ${goals.length} goals` : 'Should return array of goals');

      // Test get all goals (paginated method)
      try {
        const paginatedGoals = await goalsApi.getAllPaginated();
        this.addResult('Get all goals (paginated)', 
          paginatedGoals && Array.isArray(paginatedGoals.data) && typeof paginatedGoals.total === 'number',
          `Returned ${paginatedGoals.data.length} goals with pagination info`);
      } catch (error) {
        this.addResult('Get all goals (paginated)', false, 'Paginated method may not be available');
      }

      // Test get my goals
      try {
        const myGoals = await goalsApi.getMyGoals();
        this.addResult('Get my goals', Array.isArray(myGoals), 
          `Returned ${myGoals.length} personal goals`);
      } catch (error) {
        this.addResult('Get my goals', false, 'May fail if user not authenticated');
      }

      // Test create goal
      if (goals.length >= 0) { // Allow testing even with no initial goals
        try {
          const newGoal: CreateGoalRequest = {
            title: 'Test Goal',
            description: 'Test goal description for integration testing',
            category: 'Testing',
            priority: 'medium',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            tags: ['test', 'integration']
          };
          
          const createdGoal = await goalsApi.create(newGoal);
          const createSuccess = !!createdGoal && createdGoal.title === newGoal.title;
          this.addResult('Create goal', createSuccess, 
            createSuccess ? `Created goal: ${createdGoal.title}` : 'Failed to create goal');

          if (createdGoal) {
            // Test get goal by ID
            try {
              const goalById = await goalsApi.getById(createdGoal.id);
              this.addResult('Get goal by ID', 
                !!goalById && goalById.id === createdGoal.id,
                goalById ? `Found goal: ${goalById.title}` : 'Goal not found by ID');
            } catch (error) {
              this.addResult('Get goal by ID', false, 'Failed to retrieve goal by ID');
            }

            // Test update goal
            try {
              const updateData = { title: 'Updated Test Goal' };
              const updatedGoal = await goalsApi.update(createdGoal.id, updateData);
              this.addResult('Update goal', 
                updatedGoal.title === updateData.title,
                `Updated title to: ${updatedGoal.title}`);
            } catch (error) {
              this.addResult('Update goal', false, 'Failed to update goal');
            }

            // Test delete goal
            try {
              await goalsApi.delete(createdGoal.id);
              this.addResult('Delete goal', true, 'Goal deleted successfully');
              
              // Verify deletion
              try {
                await goalsApi.getById(createdGoal.id);
                this.addResult('Verify goal deletion', false, 'Goal still exists after deletion');
              } catch (error) {
                this.addResult('Verify goal deletion', true, 'Goal properly removed');
              }
            } catch (error) {
              this.addResult('Delete goal', false, 'Failed to delete goal');
            }
          }
        } catch (error: any) {
          this.addResult('Goal CRUD operations', false, 
            error.message || 'Failed due to authentication or validation');
        }
      } else {
        this.addResult('Create goal', false, 'No goals array available for testing');
      }

    } catch (error: any) {
      this.addResult('Goals CRUD operations', false, error.message);
    }
  }

  private async testProgressTracking(): Promise<void> {
    try {
      // Get a goal to test progress on
      const goals = await goalsApi.getAll();
      
      if (goals.length > 0) {
        const testGoal = goals[0];
        
        // Test progress update
        const originalProgress = testGoal.progress;
        const newProgress = Math.min(100, originalProgress + 10);
        const progressData = {
          progress: newProgress,
          notes: 'Test progress update from integration test'
        };
        
        try {
          const updatedGoal = await goalsApi.updateProgress(testGoal.id, progressData);
          this.addResult('Update progress', 
            updatedGoal.progress === progressData.progress,
            `Progress updated from ${originalProgress}% to ${updatedGoal.progress}%`);
        } catch (error: any) {
          this.addResult('Update progress', false, 
            error.message || 'May fail due to permissions');
        }

        // Test progress history
        try {
          const history = await goalsApi.getProgressHistory(testGoal.id);
          this.addResult('Get progress history', 
            Array.isArray(history),
            `Retrieved ${history.length} progress entries`);
        } catch (error) {
          this.addResult('Get progress history', false, 'Progress history may not be implemented yet');
        }
      } else {
        // Create a test goal for progress tracking
        try {
          const testGoal = await goalsApi.create({
            title: 'Progress Test Goal',
            description: 'Goal created for testing progress tracking',
            category: 'Testing',
            priority: 'low',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            tags: ['test', 'progress']
          });

          const progressData = { progress: 50, notes: 'Initial progress test' };
          const updatedGoal = await goalsApi.updateProgress(testGoal.id, progressData);
          
          this.addResult('Progress tracking (new goal)', 
            updatedGoal.progress === 50,
            'Created test goal and updated progress');

          // Clean up
          await goalsApi.delete(testGoal.id);
        } catch (error: any) {
          this.addResult('Progress tracking', false, 'No goals available and cannot create test goal');
        }
      }

    } catch (error: any) {
      this.addResult('Progress tracking', false, error.message);
    }
  }

  private async testGoalsFiltering(): Promise<void> {
    try {
      // Get all goals first to understand what we're working with
      const allGoals = await goalsApi.getAll();
      this.addResult('Get all goals for filtering', Array.isArray(allGoals), 
        `Found ${allGoals.length} total goals`);

      if (allGoals.length === 0) {
        this.addResult('Goals filtering', false, 'No goals available for filter testing');
        return;
      }

      // Test status filter
      const statuses = [...new Set(allGoals.map(g => g.status))];
      if (statuses.length > 0) {
        const testStatus = statuses[0];
        const filteredGoals = await goalsApi.getAll({ status: testStatus });
        const allMatchStatus = filteredGoals.every((goal: Goal) => goal.status === testStatus);
        this.addResult('Filter by status', 
          allMatchStatus,
          `Filtered by ${testStatus}: ${filteredGoals.length} goals`);
      }

      // Test priority filter
      const priorities = [...new Set(allGoals.map(g => g.priority))];
      if (priorities.length > 0) {
        const testPriority = priorities[0];
        const filteredGoals = await goalsApi.getAll({ priority: testPriority });
        const allMatchPriority = filteredGoals.every((goal: Goal) => goal.priority === testPriority);
        this.addResult('Filter by priority', 
          allMatchPriority,
          `Filtered by ${testPriority}: ${filteredGoals.length} goals`);
      }

      // Test category filter
      const categories = [...new Set(allGoals.map(g => g.category))];
      if (categories.length > 0) {
        const testCategory = categories[0];
        const filteredGoals = await goalsApi.getAll({ category: testCategory });
        const allMatchCategory = filteredGoals.every((goal: Goal) => goal.category === testCategory);
        this.addResult('Filter by category', 
          allMatchCategory,
          `Filtered by ${testCategory}: ${filteredGoals.length} goals`);
      }

      // Test search functionality
      if (allGoals.length > 0) {
        const searchTerm = allGoals[0].title.split(' ')[0]; // First word of first goal
        const searchResults = await goalsApi.getAll({ search: searchTerm });
        const hasResults = searchResults.length > 0;
        this.addResult('Search functionality', hasResults, 
          `Search for "${searchTerm}": ${searchResults.length} results`);
      }

    } catch (error: any) {
      this.addResult('Goals filtering', false, error.message);
    }
  }

  private async testGoalsStatistics(): Promise<void> {
    try {
      // Test system statistics
      const systemStats = await goalsApi.getSystemStatistics();
      const validSystemStats = typeof systemStats.totalGoals === 'number' &&
        typeof systemStats.completedGoals === 'number' &&
        typeof systemStats.completionRate === 'number';
      
      this.addResult('Get system statistics', validSystemStats, 
        validSystemStats ? 
          `Total: ${systemStats.totalGoals}, Completed: ${systemStats.completedGoals}, Rate: ${systemStats.completionRate.toFixed(1)}%` :
          'Invalid statistics format');

      // Test user statistics
      try {
        const currentUserId = localStorage.getItem('currentUserId') || 'current-user';
        const userStats = await goalsApi.getStatistics(currentUserId);
        const validUserStats = typeof userStats.totalGoals === 'number';
        
        this.addResult('Get user statistics', validUserStats,
          validUserStats ? 
            `User has ${userStats.totalGoals} goals with ${userStats.completionRate.toFixed(1)}% completion rate` :
            'Invalid user statistics format');
      } catch (error) {
        this.addResult('Get user statistics', false, 'User statistics may not be available');
      }

      // Test categories
      try {
        const categories = await goalsApi.getCategories();
        this.addResult('Get categories', Array.isArray(categories),
          `Found ${categories.length} categories: ${categories.join(', ')}`);
      } catch (error) {
        this.addResult('Get categories', false, 'Categories may not be available');
      }

    } catch (error: any) {
      this.addResult('Goals statistics', false, error.message);
    }
  }

  private async testErrorHandling(): Promise<void> {
    try {
      // Test get non-existent goal
      try {
        await goalsApi.getById('non-existent-goal-id-12345');
        this.addResult('Handle non-existent goal', false, 'Should have thrown error for missing goal');
      } catch (error) {
        this.addResult('Handle non-existent goal', true, 'Correctly handles missing goal');
      }

      // Test update non-existent goal
      try {
        await goalsApi.update('non-existent-goal-id-12345', { title: 'Test Update' });
        this.addResult('Handle update non-existent goal', false, 'Should have thrown error for missing goal');
      } catch (error) {
        this.addResult('Handle update non-existent goal', true, 'Correctly handles missing goal update');
      }

      // Test invalid create data
      try {
        await goalsApi.create({
          title: '', // Empty title
          description: '',
          category: '',
          priority: 'invalid' as any,
          dueDate: 'invalid-date',
        } as CreateGoalRequest);
        this.addResult('Handle invalid create data', false, 'Should have thrown validation error');
      } catch (error) {
        this.addResult('Handle invalid create data', true, 'Correctly validates input data');
      }

    } catch (error: any) {
      this.addResult('Error handling', false, error.message);
    }
  }

  private async testAPICompatibility(): Promise<void> {
    try {
      // Test debug info
      const debugInfo = goalsApi.getDebugInfo();
      this.addResult('API debug info', 
        typeof debugInfo === 'object' && debugInfo !== null,
        'Debug information available');

      // Test both array and paginated responses
      try {
        const arrayResponse = await goalsApi.getAll();
        const paginatedResponse = await goalsApi.getAllPaginated();
        
        const arrayValid = Array.isArray(arrayResponse);
        const paginatedValid = paginatedResponse && 
          Array.isArray(paginatedResponse.data) && 
          typeof paginatedResponse.total === 'number';

        this.addResult('API compatibility', arrayValid && paginatedValid,
          `Array method: ${arrayValid}, Paginated method: ${paginatedValid}`);
      } catch (error) {
        this.addResult('API compatibility', false, 'API compatibility issues detected');
      }

      // Test search method
      try {
        const searchResults = await goalsApi.search('test');
        this.addResult('Search method', Array.isArray(searchResults),
          `Search returned ${searchResults.length} results`);
      } catch (error) {
        this.addResult('Search method', false, 'Search method may not be available');
      }

    } catch (error: any) {
      this.addResult('API compatibility', false, error.message);
    }
  }

  private addResult(test: string, success: boolean, error?: string): void {
    this.results.push({ test, success, error });
  }

  private displayResults(): void {
    console.log('\n🎯 Goals Management Test Results:');
    console.log('='.repeat(60));
    
    let passedTests = 0;
    let failedTests = 0;
    
    this.results.forEach(({ test, success, error }) => {
      const icon = success ? '✅' : '❌';
      console.log(`${icon} ${test}`);
      if (error) {
        console.log(`   └─ ${error}`);
      }
      
      if (success) {
        passedTests++;
      } else {
        failedTests++;
      }
    });
    
    const totalTests = this.results.length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log('='.repeat(60));
    console.log(`📊 Results: ${passedTests}/${totalTests} tests passed (${successRate}%)`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All goals management tests passed! Integration complete.');
    } else if (passedTests >= totalTests * 0.8) {
      console.log('✨ Most goals management tests passed! Minor issues detected.');
    } else {
      console.log('⚠️  Several goals management tests failed. Check your implementation.');
    }

    // Additional debugging info
    if (failedTests > 0) {
      console.log('\n🔧 Debugging Tips:');
      console.log('• Check if backend server is running');
      console.log('• Verify authentication tokens');
      console.log('• Check browser console for network errors');
      console.log('• Review API endpoint configurations');
    }
  }
}

// Export for use in development
export const runGoalsTests = () => {
  const testSuite = new GoalsTestSuite();
  return testSuite.runAllTests();
};

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      await runGoalsTests();
    } catch (error) {
      console.error('Test run failed:', error);
      process.exit(1);
    }
  })();
}