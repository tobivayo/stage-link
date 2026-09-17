import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateEnvironment } from './config/environment';
import { PrismaModule } from './database/prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BandsModule } from './modules/bands/bands.module';
import { CallsModule } from './modules/calls/calls.module';
import { ChatModule } from './modules/chat/chat.module';
import { ContactIntentsModule } from './modules/contact-intents/contact-intents.module';
import { EventsModule } from './modules/events/events.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { MemberSearchApplicationsModule } from './modules/member-search-applications/member-search-applications.module';
import { MemberSearchesModule } from './modules/member-searches/member-searches.module';
import { MusicianSearchModule } from './modules/musician-search/musician-search.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { RehearsalsModule } from './modules/rehearsals/rehearsals.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { UserPreferencesModule } from './modules/user-preferences/user-preferences.module';
import { VenuesModule } from './modules/venues/venues.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    RolesModule,
    UserPreferencesModule,
    ProfilesModule,
    PortfolioModule,
    BandsModule,
    MusicianSearchModule,
    RecommendationsModule,
    MemberSearchesModule,
    MemberSearchApplicationsModule,
    ContactIntentsModule,
    VenuesModule,
    ProvidersModule,
    CallsModule,
    EventsModule,
    RehearsalsModule,
    ChatModule,
    MarketplaceModule,
    RatingsModule,
    ReportsModule,
    AdminModule,
    AuditModule,
  ],
})
export class AppModule {}
