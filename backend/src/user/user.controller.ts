import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/types/auth.types';
import { PushTokenDto } from './dto/push-token.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@ApiTags('User')
@ApiBearerAuth('access_token')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current user profile' })
  getMe(@CurrentUser() user: JwtPayload) {
    return this.userService.findById(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update name, language, currency or preferences' })
  @ApiResponse({ status: 200, description: 'Updated profile' })
  updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateUserDto) {
    return this.userService.update(user.sub, dto);
  }

  @Post('me/push-tokens')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Register an Expo push token for this device' })
  async addPushToken(
    @CurrentUser() user: JwtPayload,
    @Body() dto: PushTokenDto,
  ) {
    await this.userService.addPushToken(user.sub, dto.token);
  }

  @Delete('me/push-tokens')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unregister an Expo push token' })
  async removePushToken(
    @CurrentUser() user: JwtPayload,
    @Body() dto: PushTokenDto,
  ) {
    await this.userService.removePushToken(user.sub, dto.token);
  }
}
