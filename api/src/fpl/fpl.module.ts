import { Module } from '@nestjs/common';
import { FplController } from './fpl.controller';
import { FplService } from './fpl.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [FplController],
  providers: [FplService],
})
export class FplModule {}
