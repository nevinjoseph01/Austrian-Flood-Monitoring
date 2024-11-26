// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { VerifyEmailComponent } from './components/verify-email/verify-email.component';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { FeedComponent } from './components/feed/feed.component';
import { CreateReportComponent } from './components/create-report/create-report.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'verify-email',
    component: VerifyEmailComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'welcome/:username',
    component: WelcomeComponent,
  },
  {
    path: 'feed',
    component: FeedComponent,
  },
  {
    path: 'create-report',
    component: CreateReportComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
