const request = require('supertest');
const { app } = require('../server');

// Custom Mocks for Models
jest.mock('../models/Workspace', () => {
  return class Workspace {
    constructor(data) {
      Object.assign(this, data);
    }
    save() {
      return Promise.resolve(this);
    }
    static find = jest.fn();
    static findById = jest.fn();
  };
});

jest.mock('../models/User', () => {
  return class User {
    static findOne = jest.fn();
    static findById = jest.fn();
  };
});

// Mock auth middleware
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((token, secret, callback) => {
    callback(null, { userId: 'mock_user_id' });
  })
}));

const Workspace = require('../models/Workspace');

describe('Workspaces API Security & Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/workspaces', () => {
    it('should return workspaces for the authenticated user', async () => {
      const mockResult = [
        { _id: 'ws1', name: 'Dev Workspace', members: ['mock_user_id'] },
        { _id: 'ws2', name: 'Design Workspace', members: ['mock_user_id'] }
      ];
      Workspace.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockResult)
        })
      });

      const response = await request(app)
        .get('/api/workspaces')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Dev Workspace');
    });

    it('should block unauthenticated access (Security)', async () => {
      // Intentionally omit the Authorization header
      const response = await request(app)
        .get('/api/workspaces');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Access Denied. No token provided.');
    });
  });

  describe('POST /api/workspaces', () => {
    it('should securely create a new workspace attached to the user', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', 'Bearer valid_token')
        .send({ name: 'Secret Project X' });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Secret Project X');
      expect(response.body.ownerId).toBe('mock_user_id');
      expect(response.body.members).toContain('mock_user_id');
    });
  });
});
