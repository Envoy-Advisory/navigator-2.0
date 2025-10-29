// Mock the env and database modules before importing handlers
jest.mock('../env');
jest.mock('../database');

// Test to ensure all handlers are exported correctly
import * as handlers from '../handlers';

describe('Handlers Module Exports', () => {
  it('should export auth handlers', () => {
    expect(handlers.registerHandler).toBeDefined();
    expect(handlers.loginHandler).toBeDefined();
    expect(handlers.verifyHandler).toBeDefined();
    expect(handlers.healthHandler).toBeDefined();
  });

  it('should export file handlers', () => {
    expect(handlers.uploadFileHandler).toBeDefined();
    expect(handlers.serveFileHandler).toBeDefined();
    expect(handlers.getFileInfoHandler).toBeDefined();
  });

  it('should export public content handlers', () => {
    expect(handlers.publicModulesHandler).toBeDefined();
    expect(handlers.publicModuleArticlesHandler).toBeDefined();
    expect(handlers.publicArticleHandler).toBeDefined();
  });

  it('should export forms handlers', () => {
    expect(handlers.moduleFormsHandler).toBeDefined();
    expect(handlers.moduleFormsAuthHandler).toBeDefined();
    expect(handlers.createFormHandler).toBeDefined();
    expect(handlers.updateFormHandler).toBeDefined();
    expect(handlers.deleteFormHandler).toBeDefined();
    expect(handlers.reorderFormsHandler).toBeDefined();
  });

  it('should export form response handlers', () => {
    expect(handlers.getFormResponseHandler).toBeDefined();
    expect(handlers.postFormResponseHandler).toBeDefined();
    expect(handlers.getOrganizationUsersHandler).toBeDefined();
  });

  it('should export authenticated content handlers', () => {
    expect(handlers.authenticatedModulesHandler).toBeDefined();
    expect(handlers.authenticatedModuleArticlesHandler).toBeDefined();
  });

  it('should export admin handlers', () => {
    expect(handlers.promoteAdminHandler).toBeDefined();
    expect(handlers.adminGetModulesHandler).toBeDefined();
    expect(handlers.adminCreateModuleHandler).toBeDefined();
    expect(handlers.adminUpdateModuleHandler).toBeDefined();
    expect(handlers.adminDeleteModuleHandler).toBeDefined();
    expect(handlers.adminModuleArticlesHandler).toBeDefined();
    expect(handlers.adminCreateArticleHandler).toBeDefined();
    expect(handlers.reorderArticlesHandler).toBeDefined();
    expect(handlers.updateArticleHandler).toBeDefined();
    expect(handlers.deleteArticleHandler).toBeDefined();
  });
});

