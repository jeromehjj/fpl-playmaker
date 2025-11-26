import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS so frontend on http://localhost:3000 can talk to this API
  app.enableCors({
    origin: 'http://localhost:3000',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
}
bootstrap();
