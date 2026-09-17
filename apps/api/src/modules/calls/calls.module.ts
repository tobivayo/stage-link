import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [CallsController],
  providers: [CallsService],
  exports: [CallsService],
})
export class CallsModule {}
