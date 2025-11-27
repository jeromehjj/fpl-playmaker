import type { AuthRequest } from './../auth/types/auth-request.type';
import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FplService } from './fpl.service';

@Controller('fpl')
@UseGuards(JwtAuthGuard)
export class FplController {
  constructor(private readonly fplService: FplService) {}

  @Post('sync-team')
  async syncTeam(@Req() req: AuthRequest) {
    return this.fplService.syncTeamForUser(req.user.userId);
  }

  @Get('team')
  async getTeam(@Req() req: AuthRequest) {
    return this.fplService.getTeamOverviewForUser(req.user.userId);
  }
}
