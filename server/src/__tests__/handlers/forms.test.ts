import { Request, Response } from 'express';
import {
  moduleFormsHandler,
  moduleFormsAuthHandler,
  createFormHandler,
  updateFormHandler,
  deleteFormHandler,
  reorderFormsHandler,
} from '../../handlers/forms';

// Mock the env and database modules
jest.mock('../../env');
jest.mock('../../database');

import { prisma } from '../../database';

describe('Forms Handlers', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      params: {},
      body: {},
    };
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('moduleFormsHandler', () => {
    it('should return forms for a specific module', async () => {
      mockRequest.params = { moduleId: '1' };
      const mockForms = [
        { id: 1, moduleId: 1, formName: 'Form 1', position: 1 },
        { id: 2, moduleId: 1, formName: 'Form 2', position: 2 },
      ];
      (prisma.form.findMany as jest.Mock).mockResolvedValue(mockForms);

      await moduleFormsHandler(mockRequest as Request, mockResponse as Response);

      expect(prisma.form.findMany).toHaveBeenCalledWith({
        where: { moduleId: 1 },
        orderBy: [{ position: 'asc' }, { created_at: 'asc' }],
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockForms);
    });

    it('should handle database errors', async () => {
      mockRequest.params = { moduleId: '1' };
      (prisma.form.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await moduleFormsHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('moduleFormsAuthHandler', () => {
    it('should return forms for authenticated users', async () => {
      mockRequest.params = { moduleId: '1' };
      const mockForms = [
        { id: 1, moduleId: 1, formName: 'Form 1', position: 1 },
      ];
      (prisma.form.findMany as jest.Mock).mockResolvedValue(mockForms);

      await moduleFormsAuthHandler(mockRequest as Request, mockResponse as Response);

      expect(prisma.form.findMany).toHaveBeenCalledWith({
        where: { moduleId: 1 },
        orderBy: [{ position: 'asc' }, { created_at: 'asc' }],
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockForms);
    });

    it('should handle database errors', async () => {
      mockRequest.params = { moduleId: '1' };
      (prisma.form.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await moduleFormsAuthHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('createFormHandler', () => {
    it('should create a new form successfully', async () => {
      mockRequest.body = {
        moduleId: '1',
        formName: 'New Form',
        questions: [{ question: 'Q1', type: 'text' }],
      };
      const mockForm = { id: 1, moduleId: 1, formName: 'New Form', position: 0 };
      (prisma.form.create as jest.Mock).mockResolvedValue(mockForm);

      await createFormHandler(mockRequest as Request, mockResponse as Response);

      expect(prisma.form.create).toHaveBeenCalledWith({
        data: {
          moduleId: 1,
          formName: 'New Form',
          questions: [{ question: 'Q1', type: 'text' }],
          position: 0,
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockForm);
    });

    it('should handle database errors', async () => {
      mockRequest.body = { moduleId: '1', formName: 'New Form', questions: [] };
      (prisma.form.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await createFormHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('updateFormHandler', () => {
    it('should update a form successfully', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        formName: 'Updated Form',
        questions: [{ question: 'Q1 Updated', type: 'text' }],
      };
      const mockForm = { id: 1, formName: 'Updated Form' };
      (prisma.form.update as jest.Mock).mockResolvedValue(mockForm);

      await updateFormHandler(mockRequest as Request, mockResponse as Response);

      expect(prisma.form.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          formName: 'Updated Form',
          questions: [{ question: 'Q1 Updated', type: 'text' }],
          updated_at: expect.any(Date),
        },
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockForm);
    });

    it('should handle database errors', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { formName: 'Updated Form', questions: [] };
      (prisma.form.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await updateFormHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('deleteFormHandler', () => {
    it('should delete a form successfully', async () => {
      mockRequest.params = { id: '1' };
      (prisma.form.delete as jest.Mock).mockResolvedValue({});

      await deleteFormHandler(mockRequest as Request, mockResponse as Response);

      expect(prisma.form.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Form deleted successfully' });
    });

    it('should handle database errors', async () => {
      mockRequest.params = { id: '1' };
      (prisma.form.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      await deleteFormHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('reorderFormsHandler', () => {
    it('should reorder forms successfully', async () => {
      mockRequest.body = {
        forms: [
          { id: 1, position: 2 },
          { id: 2, position: 1 },
        ],
      };
      (prisma.form.update as jest.Mock).mockResolvedValue({});

      await reorderFormsHandler(mockRequest as Request, mockResponse as Response);

      expect(prisma.form.update).toHaveBeenCalledTimes(2);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Forms reordered successfully' });
    });

    it('should return 400 when forms data is invalid', async () => {
      mockRequest.body = { forms: 'invalid' };

      await reorderFormsHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid forms data' });
    });

    it('should return 400 when forms is not an array', async () => {
      mockRequest.body = {};

      await reorderFormsHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid forms data' });
    });

    it('should handle database errors', async () => {
      mockRequest.body = { forms: [{ id: 1, position: 1 }] };
      (prisma.form.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await reorderFormsHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});

