import httpClient from './httpClient';
import { ENDPOINTS } from './config';

export class ApiTestSuite {
  private results: Array<{ test: string; success: boolean; error?: string }> = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting API Integration Tests...');
    
    await this.testBackendConnection();
    
    await this.testAuthEndpoints();
    
    await this.testPublicEndpoints();
    
    this.displayResults();
  }

  private async testBackendConnection(): Promise<void> {
    try {
      await httpClient.get('/');
      this.addResult('Backend Connection', true);
    } catch (error) {
      this.addResult('Backend Connection', false, 'Backend not responding');
    }
  }

  private async testAuthEndpoints(): Promise<void> {
    try {
      await httpClient.get(ENDPOINTS.AUTH.PROFILE);
      this.addResult('Auth Endpoints Structure', true);
    } catch (error: any) {
      if (error.status === 401) {
        this.addResult('Auth Endpoints Structure', true, 'Correctly returns 401 for unauthorized access');
      } else {
        this.addResult('Auth Endpoints Structure', false, `Unexpected error: ${error.message}`);
      }
    }
  }

  private async testPublicEndpoints(): Promise<void> {
    const publicTests = [
      { name: 'Goals Categories', endpoint: ENDPOINTS.GOALS.CATEGORIES },
      { name: 'Goal Templates', endpoint: ENDPOINTS.GOAL_TEMPLATES.BASE },
    ];

    for (const test of publicTests) {
      try {
        await httpClient.get(test.endpoint);
        this.addResult(`Public Endpoint - ${test.name}`, true);
      } catch (error: any) {
        if (error.status === 401) {
          this.addResult(`Public Endpoint - ${test.name}`, true, 'Requires authentication (expected)');
        } else {
          this.addResult(`Public Endpoint - ${test.name}`, false, error.message);
        }
      }
    }
  }

  private addResult(test: string, success: boolean, error?: string): void {
    this.results.push({ test, success, error });
  }

  private displayResults(): void {
    console.log('\n📋 API Test Results:');
    console.log('='.repeat(50));
    
    this.results.forEach(({ test, success, error }) => {
      const icon = success ? '✅' : '❌';
      console.log(`${icon} ${test}`);
      if (error) {
        console.log(`   └─ ${error}`);
      }
    });
    
    const passedTests = this.results.filter(r => r.success).length;
    const totalTests = this.results.length;
    
    console.log('='.repeat(50));
    console.log(`📊 Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Ready for authentication integration.');
    } else {
      console.log('⚠️  Some tests failed. Check your backend configuration.');
    }
  }
}


export const runApiTests = () => {
  const testSuite = new ApiTestSuite();
  return testSuite.runAllTests();
};

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      await runApiTests();
    } catch (error) {
      console.error('Test run failed:', error);
      process.exit(1);
    }
  })();
}