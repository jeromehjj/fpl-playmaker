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
    const userId = req.user.userId;
    return this.fplService.syncTeamForUser(userId);
  }

  @Get('team')
  async getTeam(@Req() req: AuthRequest) {
    const userId = req.user.userId;
    return this.fplService.getTeamOverviewForUser(userId);
  }
}
