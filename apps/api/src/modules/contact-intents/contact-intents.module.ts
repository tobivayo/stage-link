import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { ContactIntentsController } from './contact-intents.controller';
import { ContactIntentsService } from './contact-intents.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [ContactIntentsController],
  providers: [ContactIntentsService],
})
export class ContactIntentsModule {}
