import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { ProfilesModule } from '../profiles/profiles.module';
import { MusicianSearchController } from './musician-search.controller';
import { MusicianSearchService } from './musician-search.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), ProfilesModule],
  controllers: [MusicianSearchController],
  providers: [MusicianSearchService],
  exports: [MusicianSearchService],
})
export class MusicianSearchModule {}
