import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { MemberSearchesController } from './member-searches.controller';
import { MemberSearchesService } from './member-searches.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [MemberSearchesController],
  providers: [MemberSearchesService],
  exports: [MemberSearchesService],
})
export class MemberSearchesModule {}
