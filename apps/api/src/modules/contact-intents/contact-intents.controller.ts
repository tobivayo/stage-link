import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import type { AuthenticatedRequestUser } from '../../common/auth/authenticated-user.interface';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { ContactIntentsService } from './contact-intents.service';
import { CreateContactIntentDto } from './dto/contact-intent.dto';

@Controller('contact-intents')
@UseGuards(JwtAuthGuard)
export class ContactIntentsController {
  constructor(private readonly contactIntentsService: ContactIntentsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedRequestUser, @Body() input: CreateContactIntentDto) {
    return this.contactIntentsService.create(user.id, input);
  }

  @Get('my')
  getMine(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.contactIntentsService.getMine(user.id);
  }
}
