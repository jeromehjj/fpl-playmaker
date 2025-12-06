import { Module } from '@nestjs/common';
import { FplController } from './fpl.controller';
import { FplService } from './fpl.service';
import { UsersModule } from 'src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FplTeam } from './entities/fpl-team.entity';
import { FplLeague } from './entities/fpl-league.entity';
import { FplClub } from './entities/fpl-club.entity';
import { FplPlayer } from './entities/fpl-player.entity';
import { FplApiClient } from './services/fpl-api.client';
import { FplFixturesService } from './services/fpl-fixtures.service';
import { FplTeamService } from './services/fpl-team.service';
import { FplSquadService } from './services/fpl-squad.service';
import { FplTransferService } from './services/fpl-transfer.service';
import { FplPlayersService } from './services/fpl-players.service';
import { FplBootstrapService } from './services/fpl-bootstrap.service';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([FplTeam, FplLeague, FplClub, FplPlayer]),
  ],
  controllers: [FplController],
  providers: [
    FplService,
    FplApiClient,
    FplFixturesService,
    FplTeamService,
    FplSquadService,
    FplTransferService,
    FplPlayersService,
    FplBootstrapService,
  ],
  exports: [
    FplService,
    FplApiClient,
    FplFixturesService,
    FplTeamService,
    FplSquadService,
    FplTransferService,
    FplPlayersService,
    FplBootstrapService,
  ],
})
export class FplModule {}
