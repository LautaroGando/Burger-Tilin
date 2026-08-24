import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { RappiAdapter } from '../services/channels/rappi-adapter';

// Mock de Axios
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  const mockAxiosInstance = {
    post: vi.fn(),
    request: vi.fn(),
    interceptors: {
      response: {
        use: vi.fn()
      }
    }
  };
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(() => mockAxiosInstance),
      isAxiosError: vi.fn((err: any) => err?.isAxiosError === true),
    }
  };
});

describe('RappiAdapter', () => {
  let adapter: RappiAdapter;
  let mockAxiosInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RAPPI_CLIENT_ID = 'test-client';
    process.env.RAPPI_CLIENT_SECRET = 'test-secret';
    process.env.WRITE_REAL_RAPPI_API = 'false'; // Modo solo lectura
    
    adapter = new RappiAdapter();
    mockAxiosInstance = axios.create();
  });

  it('debe autenticar y cachear el token', async () => {
    mockAxiosInstance.post.mockResolvedValueOnce({
      data: { access_token: 'token123', expires_in: 3600 }
    });

    mockAxiosInstance.request.mockResolvedValueOnce({
      data: { items: [] }
    });

    await adapter.getCatalog();

    // Verificamos que llamó a autenticar
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/restaurants/auth/v1/token/login/integrations', {
      client_id: 'test-client',
      client_secret: 'test-secret'
    });

    // Verificamos que usó el token (y x-authorization)
    expect(mockAxiosInstance.request).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { 
          'Authorization': 'Bearer token123',
          'x-authorization': 'Bearer token123'
        }
      })
    );
  });

  it('debe bloquear updateProductPrice si WRITE_REAL_RAPPI_API no es true', async () => {
    await expect(adapter.updateProductPrice('ext-123', 1000)).rejects.toThrow(
      'Modo escritura (WRITE_REAL_RAPPI_API) deshabilitado. No se permite modificar datos reales en Rappi.'
    );
    expect(mockAxiosInstance.request).not.toHaveBeenCalled();
  });

  it('debe limpiar los secretos si ocurre un AxiosError (Sanitización)', async () => {
    // Para probar la sanitización, necesitamos obtener el interceptor registrado
    const useSpy = mockAxiosInstance.interceptors.response.use;
    expect(useSpy).toHaveBeenCalled();
    const errorInterceptor = useSpy.mock.calls[0][1];

    // Simulamos un error Axios con headers secretos
    const fakeError = {
      isAxiosError: true,
      config: {
        headers: {
          'Authorization': 'Bearer TOP_SECRET',
          'x-api-key': 'TOP_SECRET_KEY'
        }
      },
      response: {
        config: {
          headers: {
            'Authorization': 'Bearer TOP_SECRET',
            'x-api-key': 'TOP_SECRET_KEY'
          }
        }
      }
    };

    try {
      await errorInterceptor(fakeError);
    } catch (err: any) {
      expect(err.config.headers['Authorization']).toBe('[REDACTED]');
      expect(err.config.headers['x-api-key']).toBe('[REDACTED]');
      expect(err.response.config.headers['Authorization']).toBe('[REDACTED]');
      expect(err.response.config.headers['x-api-key']).toBe('[REDACTED]');
    }
  });
});
