import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { CallsModule } from '../calls/calls.module';
import { CallSelectionController } from './call-selection.controller';
import { CallSelectionService } from './call-selection.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), CallsModule],
  controllers: [CallSelectionController],
  providers: [CallSelectionService],
})
export class CallSelectionModule {}
