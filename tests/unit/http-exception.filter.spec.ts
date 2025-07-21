import { AllExceptionsFilter } from '../../src/common/filters/http-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: any;
  let mockContext: any;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockContext = {
      switchToHttp: () => ({ getResponse: () => mockResponse, getRequest: () => ({ url: '/test' }) }),
    } as unknown as ArgumentsHost;
  });

  it('should handle HttpException with object response', () => {
    const exception = new HttpException({ error: 'Error', message: 'fail' }, HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockContext);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      error: 'Error',
      message: 'fail',
      path: '/test',
    }));
  });

  it('should handle HttpException with string response', () => {
    const exception = new HttpException('fail', HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockContext);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      error: 'Internal Server Error',
      message: 'fail',
      path: '/test',
    }));
  });

  it('should handle generic Error', () => {
    const exception = new Error('fail');
    filter.catch(exception, mockContext);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'fail',
      path: '/test',
    }));
  });

  it('should handle unknown exception', () => {
    filter.catch('fail', mockContext);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Internal server error',
      path: '/test',
    }));
  });
}); 