import { Routes, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { LaunchComponent } from './components/launch/launch.component';
import { SignupComponent } from './components/auth/signup.component';
import { LoginComponent } from './components/auth/login.component';
import { HomeComponent } from './components/home/home.component';
import { CreateFormComponent } from './components/create-form/create-form.component';
import { FormSubmissionComponent } from './components/form-submission/form-submission.component';
import { ConfirmationComponent } from './components/confirmation/confirmation.component';
import { AnalyticsComponent } from './components/analytics/analytics.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { authGuard } from './guards/auth.guard';
import { AuthService } from './services/auth.service';

export const routes: Routes = [
  { 
    path: '', 
    component: LaunchComponent, 
    canActivate: [
      (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
        const authService = inject(AuthService);
        const router = inject(Router);
        
        // If user is authenticated, redirect to home
        if (authService.isAuthenticated) {
          router.navigate(['/home']);
          return false;
        }
        return true;
      }
    ] 
  },
  { 
    path: 'auth/signup', 
    component: SignupComponent,
    canActivate: [
      (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
        const authService = inject(AuthService);
        const router = inject(Router);
        
        // If user is authenticated, redirect to home
        if (authService.isAuthenticated) {
          router.navigate(['/home']);
          return false;
        }
        return true;
      }
    ] 
  },
  { 
    path: 'auth/login', 
    component: LoginComponent,
    canActivate: [
      (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
        const authService = inject(AuthService);
        const router = inject(Router);
        
        // If user is authenticated, redirect to home
        if (authService.isAuthenticated) {
          router.navigate(['/home']);
          return false;
        }
        return true;
      }
    ] 
  },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'create-form', component: CreateFormComponent, canActivate: [authGuard] },
  { path: 'create-form/:id', component: CreateFormComponent, canActivate: [authGuard] },
  { path: 'forms/:id', component: CreateFormComponent, canActivate: [authGuard] }, 
  { path: 'form/:id', component: FormSubmissionComponent },
  { path: 'confirmation/:id', component: ConfirmationComponent },
  { path: 'analytics', component: AnalyticsComponent, canActivate: [authGuard] },
  { path: 'analytics/:id', component: AnalyticsComponent, canActivate: [authGuard] },
  { path: 'profile', component: UserProfileComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
