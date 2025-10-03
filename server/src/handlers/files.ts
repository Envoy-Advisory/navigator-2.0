import { Request, Response } from 'express';
import path from 'path';
import sharp from 'sharp';
import { prisma as db } from '../database';
import { AuthenticatedRequest } from '../types';

const prismaClient: any = db as any;

// File helpers
const saveFileToDatabase = async (fileData: {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  data: Buffer;
  uploadedBy?: number;
}) => {
  try {
    const file = await prismaClient.file.create({
      data: {
        filename: fileData.filename,
        originalName: fileData.originalName,
        mimeType: fileData.mimeType,
        size: fileData.size,
        data: fileData.data,
        uploadedBy: fileData.uploadedBy
      }
    });
    return file;
  } catch (error) {
    console.error('Error saving file to database:', error);
    throw error;
  }
};

export async function uploadFileHandler(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let processedBuffer = req.file.buffer;
    let finalMimetype = req.file.mimetype;

    if (req.file.mimetype.startsWith('image/')) {
      processedBuffer = await sharp(req.file.buffer)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();

      finalMimetype = 'image/jpeg';
    }

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(req.file.originalname);
    const filename = `file-${timestamp}-${randomSuffix}${extension}`;

    const fileRecord = await saveFileToDatabase({
      filename,
      originalName: req.file.originalname,
      mimeType: finalMimetype,
      size: processedBuffer.length,
      data: processedBuffer,
      uploadedBy: req.user?.userId
    });

    res.json({
      message: 'File uploaded successfully',
      file: {
        id: fileRecord.id,
        filename: fileRecord.filename,
        originalName: fileRecord.originalName,
        url: `/api/files/${fileRecord.id}`,
        size: fileRecord.size,
        mimeType: fileRecord.mimeType
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to save file', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

export async function serveFileHandler(req: Request, res: Response) {
  try {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) return res.status(400).json({ error: 'Invalid file ID' });
    const fileRecord = await prismaClient.file.findUnique({ where: { id: fileId } });
    if (!fileRecord) return res.status(404).json({ error: 'File not found' });

    res.setHeader('Content-Type', fileRecord.mimeType);
    res.setHeader('Content-Length', fileRecord.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Content-Disposition', `inline; filename="${fileRecord.originalName}"`);

    res.end(fileRecord.data);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getFileInfoHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) return res.status(400).json({ error: 'Invalid file ID' });

    const fileRecord = await prismaClient.file.findUnique({
      where: { id: fileId },
      select: { id: true, filename: true, originalName: true, mimeType: true, size: true, created_at: true }
    });

    if (!fileRecord) return res.status(404).json({ error: 'File not found' });
    res.json(fileRecord);
  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
