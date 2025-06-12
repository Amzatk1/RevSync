import { ConnectionTest } from '../services/connectionTest';
import motorcycleService from '../services/motorcycleService';
import tuneService from '../services/tuneService';
import config from '../config/environment';

export class DevelopmentHelper {
  /**
   * Run comprehensive connection and API tests
   */
  static async runDiagnostics(): Promise<void> {
    if (!config.ENABLE_LOGGING) {
      console.log('⚠️ Diagnostics only available in development mode');
      return;
    }

    console.log('🔧 Running RevSync Mobile Diagnostics...');
    console.log('================================================');
    
    // Environment info
    console.log('📱 Environment Configuration:');
    console.log(`   API Base URL: ${config.API_BASE_URL}`);
    console.log(`   Timeout: ${config.API_TIMEOUT}ms`);
    console.log(`   Environment: ${config.ENVIRONMENT}`);
    console.log('');

    // Connection test
    console.log('🔗 Testing Backend Connection...');
    const connectionResult = await ConnectionTest.testConnection();
    
    if (connectionResult.isConnected) {
      console.log(`✅ Connected successfully (${connectionResult.responseTime}ms)`);
      console.log(`   Backend Data:`, connectionResult.backendInfo);
    } else {
      console.log(`❌ Connection failed: ${connectionResult.error}`);
      console.log(`   Response time: ${connectionResult.responseTime}ms`);
    }
    console.log('');

    // Test individual endpoints
    console.log('🎯 Testing API Endpoints...');
    const endpointResults = await ConnectionTest.testEndpoints();
    
    Object.entries(endpointResults).forEach(([endpoint, success]) => {
      console.log(`   ${success ? '✅' : '❌'} ${endpoint}`);
    });
    console.log('');

    // Test services
    console.log('🔧 Testing Services...');
    try {
      const manufacturers = await motorcycleService.getManufacturers();
      console.log(`✅ Motorcycle Service: ${manufacturers.length} manufacturers loaded`);
    } catch (error) {
      console.log(`❌ Motorcycle Service failed: ${error}`);
    }

    try {
      const categories = await tuneService.getCategories();
      console.log(`✅ Tune Service: ${categories.length} categories loaded`);
    } catch (error) {
      console.log(`❌ Tune Service failed: ${error}`);
    }

    console.log('================================================');
    console.log('🎉 Diagnostics complete!');
  }

  /**
   * Log current app state for debugging
   */
  static logAppState(): void {
    if (!config.ENABLE_LOGGING) return;
    
    console.log('📊 Current App State:');
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log(`   Environment: ${config.ENVIRONMENT}`);
    console.log(`   API URL: ${config.API_BASE_URL}`);
  }

  /**
   * Test specific API call for debugging
   */
  static async testApiCall(endpoint: string): Promise<void> {
    if (!config.ENABLE_LOGGING) return;
    
    console.log(`🧪 Testing API call: ${endpoint}`);
    try {
      const response = await fetch(`${config.API_BASE_URL}${endpoint}`);
      const data = await response.json();
      console.log(`✅ Success:`, data);
    } catch (error) {
      console.log(`❌ Failed:`, error);
    }
  }
}

export default DevelopmentHelper; 