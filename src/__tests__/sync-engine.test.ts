import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processQueue } from '../services/sync/sync-engine';
import { AdapterRegistry } from '../services/channels/adapters';

// Mock de Prisma Client
const mockPrisma = vi.hoisted(() => ({
  syncJob: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
  productChannelMapping: {
    findUnique: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  }
}));

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      constructor() {
        return mockPrisma;
      }
    }
  };
});

describe('Sync Engine - processQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe procesar un trabajo PENDING exitosamente', async () => {
    mockPrisma.syncJob.findMany.mockResolvedValue([
      {
        id: 'job-1',
        productId: 'prod-1',
        platformId: 'plat-1',
        operation: 'UPDATE_PRICE',
        payload: { newPrice: 1000 },
        attempts: 0,
        platform: { name: 'PEYA' }
      }
    ]);

    mockPrisma.productChannelMapping.findUnique.mockResolvedValue({
      externalProductId: 'ext-123'
    });

    const processed = await processQueue();

    expect(processed).toBe(1);
    expect(mockPrisma.syncJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-1' },
        data: expect.objectContaining({ status: 'SUCCESS', responseStatus: 200 })
      })
    );
  });

  it('debe fallar inmediatamente sin retries ante un error 401 (AUTH_ERROR)', async () => {
    mockPrisma.syncJob.findMany.mockResolvedValue([
      {
        id: 'job-401',
        productId: 'prod-1',
        platformId: 'plat-1',
        operation: 'UPDATE_PRICE',
        payload: { newPrice: 401 }, // triggers 401 error in MockAdapter
        attempts: 0,
        platform: { name: 'PEYA' }
      }
    ]);

    mockPrisma.productChannelMapping.findUnique.mockResolvedValue({
      externalProductId: 'ext-401'
    });

    await processQueue();

    expect(mockPrisma.syncJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-401' },
        data: expect.objectContaining({
          status: 'FAILED',
          errorCode: 'AUTH_ERROR',
          responseStatus: 401
        })
      })
    );
  });

  it('debe hacer exponential backoff para error 429 (RATE_LIMIT)', async () => {
    mockPrisma.syncJob.findMany.mockResolvedValue([
      {
        id: 'job-429',
        productId: 'prod-1',
        platformId: 'plat-1',
        operation: 'UPDATE_PRICE',
        payload: { newPrice: 429 }, // triggers 429 error in MockAdapter
        attempts: 0,
        platform: { name: 'PEYA' }
      }
    ]);

    mockPrisma.productChannelMapping.findUnique.mockResolvedValue({
      externalProductId: 'ext-429'
    });

    await processQueue();

    expect(mockPrisma.syncJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-429' },
        data: expect.objectContaining({
          status: 'RETRYING',
          errorCode: 'RATE_LIMIT',
          responseStatus: 429
        })
      })
    );
    
    // Verificamos que se establece un nextRetryAt
    const updateCall = mockPrisma.syncJob.update.mock.calls.find(c => c[0].where.id === 'job-429' && c[0].data.status === 'RETRYING');
    expect(updateCall[0].data.nextRetryAt).toBeInstanceOf(Date);
  });

  it('debe fallar si no hay mapeo de producto', async () => {
    mockPrisma.syncJob.findMany.mockResolvedValue([
      {
        id: 'job-nomap',
        productId: 'prod-nomap',
        platformId: 'plat-1',
        operation: 'UPDATE_PRICE',
        payload: { newPrice: 1000 },
        attempts: 0,
        platform: { name: 'PEYA' }
      }
    ]);

    // Retorna null simulando que no hay mapeo en DB
    mockPrisma.productChannelMapping.findUnique.mockResolvedValue(null);

    await processQueue();

    expect(mockPrisma.syncJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-nomap' },
        data: expect.objectContaining({
          status: 'FAILED',
          errorCode: 'SYSTEM_ERROR'
        })
      })
    );
  });
});
