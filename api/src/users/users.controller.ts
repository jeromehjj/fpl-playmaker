import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthRequest } from 'src/auth/types/auth-request.type';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: AuthRequest) {
    const user = await this.usersService.findById(req.user.userId);
    return {
      id: user?.id,
      email: user?.email,
      fplTeamId: user?.fplTeamId,
      createdAt: user?.createdAt,
    };
  }

  @Put('me')
  async updateMe(
    @Req() req: AuthRequest,
    @Body('fplTeamId') fplTeamId: string | null,
  ) {
    const updated = await this.usersService.updateFplTeamId(
      req.user.userId,
      fplTeamId,
    );
    return {
      id: updated?.id,
      email: updated?.email,
      fplTeamId: updated?.fplTeamId,
      createdAt: updated?.createdAt,
    };
  }
}
