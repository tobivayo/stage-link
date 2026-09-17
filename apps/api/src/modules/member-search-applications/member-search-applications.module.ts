import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { MemberSearchesModule } from '../member-searches/member-searches.module';
import { MemberSearchApplicationsController } from './member-search-applications.controller';
import { MemberSearchApplicationsService } from './member-search-applications.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), MemberSearchesModule],
  controllers: [MemberSearchApplicationsController],
  providers: [MemberSearchApplicationsService],
})
export class MemberSearchApplicationsModule {}
