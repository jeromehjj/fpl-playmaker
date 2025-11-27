import { Module } from '@nestjs/common';
import { FplController } from './fpl.controller';
import { FplService } from './fpl.service';
import { UsersModule } from 'src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FplTeam } from './entities/fpl-team.entity';
import { FplLeague } from './entities/fpl-league.entity';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([FplTeam, FplLeague])],
  controllers: [FplController],
  providers: [FplService],
  exports: [FplService],
})
export class FplModule {}
