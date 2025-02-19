// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { VerifyEmailComponent } from './components/verify-email/verify-email.component';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { FeedComponent } from './components/feed/feed.component';
import { ContactComponent } from './components/contact/contact.component';
import { CreateReportComponent } from './components/create-report/create-report.component';
import { TasksComponent } from './components/tasks/tasks.component';
import { CreateTaskComponent } from './components/create-task/create-task.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { EditProfileComponent } from './components/edit-profile/edit-profile.component';

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
    path: 'contact',
    component: ContactComponent,
  },
  {
    path: 'create-report',
    component: CreateReportComponent,
  },
  {
    path: 'tasks',
    component: TasksComponent,
  },
  {
    path: 'create-task',
    component: CreateTaskComponent,
  },
  {
    path: 'edit-profile',
    component: EditProfileComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
