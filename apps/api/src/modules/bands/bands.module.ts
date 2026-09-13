import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { BandsController } from './bands.controller';
import { BandsService } from './bands.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [BandsController],
  providers: [BandsService],
  exports: [BandsService],
})
export class BandsModule {}
