import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      message: 'Zevan API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/health',
        auth: '/auth',
        users: '/users',
        events: '/events',
        catalog: '/categories, /products',
        audit: '/audit',
      },
    };
  }
}
