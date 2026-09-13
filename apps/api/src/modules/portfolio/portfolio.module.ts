import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}
