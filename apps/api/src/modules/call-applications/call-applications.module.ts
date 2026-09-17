import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { CallsModule } from '../calls/calls.module';
import { CallApplicationsController } from './call-applications.controller';
import { CallApplicationsService } from './call-applications.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), CallsModule],
  controllers: [CallApplicationsController],
  providers: [CallApplicationsService],
})
export class CallApplicationsModule {}
