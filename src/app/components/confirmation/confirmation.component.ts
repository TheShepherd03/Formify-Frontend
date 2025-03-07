import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsService } from '../../services/forms.service';
import { FormSubmission } from '../../models/form.model';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class ConfirmationComponent implements OnInit {
  submissionId: string = '';
  submission: FormSubmission | null = null;
  formName: string = '';
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formsService: FormsService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.submissionId = params['id'];
      this.loadSubmission();
    });
  }

  loadSubmission(): void {
    this.isLoading = true;
    this.formsService.getSubmission(this.submissionId).subscribe({
      next: (submission) => {
        this.submission = submission;
        this.loadFormDetails(submission.form_id);
      },
      error: (error) => {
        this.errorMessage = 'Failed to load submission details.';
        this.isLoading = false;
      }
    });
  }

  loadFormDetails(formId: string): void {
    this.formsService.getPublicForm(formId).subscribe({
      next: (form) => {
        this.formName = form.name;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load form details.';
        this.isLoading = false;
      }
    });
  }

  goToHome(): void {
    // Check if user is authenticated before navigating to home
    if (localStorage.getItem('token')) {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/']);
    }
  }

  createNewForm(): void {
    // Check if user is authenticated before navigating to create form
    if (localStorage.getItem('token')) {
      this.router.navigate(['/create-form']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  viewAllForms(): void {
    // Check if user is authenticated before navigating to home
    if (localStorage.getItem('token')) {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
