import { Request, Response } from 'express';
import { uploadFileHandler, serveFileHandler, getFileInfoHandler } from '../../handlers/files';
import { AuthenticatedRequest } from '../../types';

// Mock the env and database modules
jest.mock('../../env');
jest.mock('../../database');

// Mock sharp
jest.mock('sharp', () => {
  return jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image-data')),
  }));
});

import { prisma } from '../../database';

describe('Files Handlers', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      params: {},
      body: {},
      user: { userId: 1, email: 'test@example.com', role: 'user' },
    };
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      end: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('uploadFileHandler', () => {
    it('should upload and process an image file', async () => {
      mockRequest.file = {
        originalname: 'test-image.png',
        buffer: Buffer.from('image-data'),
        mimetype: 'image/png',
        size: 1024,
      } as Express.Multer.File;

      const mockFileRecord = {
        id: 1,
        filename: 'file-123456-abc123.png',
        originalName: 'test-image.png',
        mimeType: 'image/jpeg',
        size: 18,
      };
      (prisma.file.create as jest.Mock).mockResolvedValue(mockFileRecord);

      await uploadFileHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(prisma.file.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          originalName: 'test-image.png',
          mimeType: 'image/jpeg',
          uploadedBy: 1,
        }),
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'File uploaded successfully',
        file: {
          id: 1,
          filename: 'file-123456-abc123.png',
          originalName: 'test-image.png',
          url: '/api/files/1',
          size: 18,
          mimeType: 'image/jpeg',
        },
      });
    });

    it('should upload a non-image file without processing', async () => {
      mockRequest.file = {
        originalname: 'document.pdf',
        buffer: Buffer.from('pdf-data'),
        mimetype: 'application/pdf',
        size: 2048,
      } as Express.Multer.File;

      const mockFileRecord = {
        id: 2,
        filename: 'file-123456-abc123.pdf',
        originalName: 'document.pdf',
        mimeType: 'application/pdf',
        size: 8,
      };
      (prisma.file.create as jest.Mock).mockResolvedValue(mockFileRecord);

      await uploadFileHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(prisma.file.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          originalName: 'document.pdf',
          mimeType: 'application/pdf',
          uploadedBy: 1,
        }),
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'File uploaded successfully',
        file: expect.objectContaining({
          id: 2,
          originalName: 'document.pdf',
        }),
      });
    });

    it('should return 400 when no file is uploaded', async () => {
      mockRequest.file = undefined;

      await uploadFileHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No file uploaded' });
    });

    it('should handle database errors', async () => {
      mockRequest.file = {
        originalname: 'test.txt',
        buffer: Buffer.from('data'),
        mimetype: 'text/plain',
        size: 100,
      } as Express.Multer.File;

      (prisma.file.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await uploadFileHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to save file',
        details: 'Database error',
      });
    });
  });

  describe('serveFileHandler', () => {
    it('should serve a file with correct headers', async () => {
      mockRequest.params = { id: '1' };
      const mockFileRecord = {
        id: 1,
        filename: 'file.jpg',
        originalName: 'original.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        data: Buffer.from('file-data'),
      };
      (prisma.file.findUnique as jest.Mock).mockResolvedValue(mockFileRecord);

      await serveFileHandler(mockRequest as Request, mockResponse as Response);

      expect(prisma.file.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Length', 1024);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=31536000');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', 'inline; filename="original.jpg"');
      expect(mockResponse.end).toHaveBeenCalledWith(mockFileRecord.data);
    });

    it('should return 400 for invalid file ID', async () => {
      mockRequest.params = { id: 'invalid' };

      await serveFileHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid file ID' });
    });

    it('should return 404 when file is not found', async () => {
      mockRequest.params = { id: '999' };
      (prisma.file.findUnique as jest.Mock).mockResolvedValue(null);

      await serveFileHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'File not found' });
    });

    it('should handle database errors', async () => {
      mockRequest.params = { id: '1' };
      (prisma.file.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await serveFileHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('getFileInfoHandler', () => {
    it('should return file information', async () => {
      mockRequest.params = { id: '1' };
      const mockFileRecord = {
        id: 1,
        filename: 'file.jpg',
        originalName: 'original.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        created_at: new Date('2024-01-01'),
      };
      (prisma.file.findUnique as jest.Mock).mockResolvedValue(mockFileRecord);

      await getFileInfoHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(prisma.file.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          filename: true,
          originalName: true,
          mimeType: true,
          size: true,
          created_at: true,
        },
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockFileRecord);
    });

    it('should return 400 for invalid file ID', async () => {
      mockRequest.params = { id: 'invalid' };

      await getFileInfoHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid file ID' });
    });

    it('should return 404 when file is not found', async () => {
      mockRequest.params = { id: '999' };
      (prisma.file.findUnique as jest.Mock).mockResolvedValue(null);

      await getFileInfoHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'File not found' });
    });

    it('should handle database errors', async () => {
      mockRequest.params = { id: '1' };
      (prisma.file.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getFileInfoHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});

