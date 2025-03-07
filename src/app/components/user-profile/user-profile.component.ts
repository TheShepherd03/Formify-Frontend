import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { HeaderComponent } from '../shared/header/header.component';
import { environment } from '../../../environments/environment';

interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  user: User | null = null;
  isLoading = true;
  error: string | null = null;
  successMessage: string | null = null;
  
  profileForm: FormGroup;
  passwordForm: FormGroup;
  
  isEditMode = false;
  isChangingPassword = false;
  
  constructor(
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]]
    });
    
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }
  
  loadUserProfile(): void {
    this.isLoading = true;
    this.error = null;
    
    this.http.get<User>(`${environment.apiUrl}/users/profile`)
      .subscribe({
        next: (user) => {
          this.user = user;
          this.isLoading = false;
          
          // Initialize form with user data
          this.profileForm.patchValue({
            name: user.name || '',
            email: user.email
          });
        },
        error: (err) => {
          this.error = 'Failed to load user profile. Please try again.';
          this.isLoading = false;
          console.error('Error loading user profile:', err);
        }
      });
  }
  
  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    this.successMessage = null;
    this.error = null;
    
    if (!this.isEditMode && this.user) {
      // Reset form when canceling edit
      this.profileForm.patchValue({
        name: this.user.name || '',
        email: this.user.email
      });
    }
  }
  
  togglePasswordChange(): void {
    this.isChangingPassword = !this.isChangingPassword;
    this.successMessage = null;
    this.error = null;
    
    if (!this.isChangingPassword) {
      // Reset password form when canceling
      this.passwordForm.reset();
    }
  }
  
  updateProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    this.error = null;
    this.successMessage = null;
    
    const updatedProfile = this.profileForm.value;
    
    this.http.put<User>(`${environment.apiUrl}/users/profile`, updatedProfile)
      .subscribe({
        next: (user) => {
          this.user = user;
          this.isLoading = false;
          this.isEditMode = false;
          this.successMessage = 'Profile updated successfully!';
        },
        error: (err) => {
          this.error = 'Failed to update profile. Please try again.';
          this.isLoading = false;
          console.error('Error updating profile:', err);
        }
      });
  }
  
  changePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    this.error = null;
    this.successMessage = null;
    
    const passwordData = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };
    
    this.http.post(`${environment.apiUrl}/users/change-password`, passwordData)
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.isChangingPassword = false;
          this.passwordForm.reset();
          this.successMessage = 'Password changed successfully!';
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to change password. Please try again.';
          this.isLoading = false;
          console.error('Error changing password:', err);
        }
      });
  }
  
  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }
  
  getPasswordMatchError(): boolean {
    return (
      this.passwordForm.errors?.['passwordMismatch'] &&
      this.passwordForm.get('confirmPassword')?.touched
    ) || false;
  }
  
  navigateToHome(): void {
    this.router.navigate(['/home']);
  }
}
