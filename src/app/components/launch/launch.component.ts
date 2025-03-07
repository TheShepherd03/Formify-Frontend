import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-launch',
  templateUrl: './launch.component.html',
  styleUrls: ['./launch.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class LaunchComponent implements OnInit {
  logoPath = 'assets/images/formifyLogoIcon.png';
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // If user is already authenticated, redirect to home
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/home']);
    }
  }

  navigateToRegister(): void {
    this.router.navigate(['/auth/signup']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}



