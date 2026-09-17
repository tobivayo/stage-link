import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { CallConfirmationsController } from './call-confirmations.controller';
import { CallConfirmationsService } from './call-confirmations.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [CallConfirmationsController],
  providers: [CallConfirmationsService],
})
export class CallConfirmationsModule {}
