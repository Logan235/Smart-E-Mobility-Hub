import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bật CORS cho phép kết nối từ Frontend
  app.enableCors({
    origin: 'http://localhost:5173', // Port mặc định của Vite React
    credentials: true,
  });

  // Đặt tiền tố API global
  app.setGlobalPrefix('api');

  await app.listen(3000);
  console.log(`Backend running on: http://localhost:3000/api`);
}
bootstrap();

