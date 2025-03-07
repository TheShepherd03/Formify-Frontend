import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsService } from '../../services/forms.service';
import { Form, FormField, FormWithFields } from '../../models/form.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderComponent } from '../../components/shared/header/header.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent]
})
export class HomeComponent implements OnInit {
  forms: Form[] = [];
  isLoading: boolean = false;
  searchQuery: string = '';
  
  // Form preview properties
  showPreview: boolean = false;
  previewForm: FormWithFields | null = null;
  previewLoading: boolean = false;
  previewError: string = '';
  previewFormGroup!: FormGroup;
  formSections: { [key: string]: FormField[] } = {};
  isLoggedIn: boolean = false;
  userEmail: string = '';

  constructor(
    private formsService: FormsService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.previewFormGroup = this.fb.group({});
    this.loadForms();
    this.checkLoginStatus();
  }

  checkLoginStatus(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.isLoggedIn = true;
        this.userEmail = user.email || '';
      } catch (error) {
        this.isLoggedIn = false;
      }
    }
  }

  loadForms(): void {
    this.isLoading = true;
    this.formsService.getForms().subscribe({
      next: (forms) => {
        this.forms = forms;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading forms:', error);
        this.isLoading = false;
      }
    });
  }

  createNewForm(): void {
    this.router.navigate(['/create-form']);
  }
  
  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  manageForm(formId: string): void {
    // Navigate to the edit form page with the form ID
    this.router.navigate(['/create-form', formId]);
  }
  
  previewFormById(formId: string): void {
    this.previewLoading = true;
    this.previewError = '';
    this.previewForm = null;
    this.showPreview = true;
    
    this.formsService.getFormWithFields(formId).subscribe({
      next: (formWithFields) => {
        this.previewForm = formWithFields;
        this.previewLoading = false;
        this.initializePreviewForm(formWithFields);
      },
      error: (error) => {
        console.error('Error loading form preview:', error);
        this.previewError = 'Failed to load form preview. Please try again.';
        this.previewLoading = false;
      }
    });
  }
  
  initializePreviewForm(form: FormWithFields): void {
    // Reset form group
    this.previewFormGroup = this.fb.group({});
    
    // Organize fields by type for display
    this.organizeFieldsByType(form.fields || []);
    
    // Create form controls for each field
    if (form.fields && form.fields.length > 0) {
      form.fields.forEach(field => {
        // Handle different field types
        if (field.field_type === 'checkbox') {
          // For checkboxes, check if there are multiple options
          const options = field.options?.split(',').map(opt => opt.trim()) || [];
          if (options.length > 0) {
            // Create a form group for multiple checkbox options
            const checkboxGroup: any = {};
            options.forEach(option => {
              checkboxGroup[option] = [false, []]; // Default to unchecked
            });
            this.previewFormGroup.addControl(field.id!, this.fb.group(checkboxGroup));
          } else {
            // Single checkbox
            this.previewFormGroup.addControl(
              field.id!,
              this.fb.control(false, field.required ? [Validators.required] : [])
            );
          }
        } else {
          // For other field types including radio buttons
          this.previewFormGroup.addControl(
            field.id!,
            this.fb.control('', field.required ? [Validators.required] : [])
          );
          
          // Add additional validators based on field type
          if (field.field_type === 'email') {
            this.previewFormGroup.get(field.id!)?.addValidators(Validators.email);
          }
        }
      });
    }
  }
  
  isPreviewCheckboxChecked(fieldId: string, option: string): boolean {
    const control = this.previewFormGroup.get(fieldId);
    if (control && control instanceof FormGroup && control.get(option)) {
      return control.get(option)?.value === true;
    }
    return false;
  }
  
  organizeFieldsByType(fields: FormField[]): void {
    // Reset sections
    this.formSections = {
      text: [],
      email: [],
      number: [],
      date: [],
      checkbox: [],
      radio: [],
      dropdown: [],
      file: []
    };
    
    // Sort fields by order_number
    const sortedFields = [...fields].sort((a, b) => {
      return (a.order_number || 0) - (b.order_number || 0);
    });
    
    // Group fields by type
    sortedFields.forEach(field => {
      const type = field.field_type as string;
      if (!this.formSections[type]) {
        this.formSections[type] = [];
      }
      this.formSections[type].push(field);
    });
  }
  
  hasFieldsOfType(types: string[]): boolean {
    if (!this.previewForm || !this.previewForm.fields) return false;
    return this.previewForm.fields.some(field => types.includes(field.field_type));
  }
  
  getFieldsByType(types: string[]): FormField[] {
    if (!this.previewForm || !this.previewForm.fields) return [];
    return this.previewForm.fields.filter(field => types.includes(field.field_type));
  }
  
  closePreview(): void {
    this.showPreview = false;
    this.previewForm = null;
  }
  
  shareForm(formId: string, event: Event): void {
    event.stopPropagation(); // Prevent the preview from opening
    // Copy the public form link to clipboard
    const formLink = `${window.location.origin}/form/${formId}`;
    navigator.clipboard.writeText(formLink).then(() => {
      alert('Form link copied to clipboard!');
    }).catch(err => {
      console.error('Could not copy link: ', err);
    });
  }
  
  viewAnalytics(formId: string): void {
    // Navigate to the analytics page for this form
    this.router.navigate(['/analytics', formId]);
  }
  
  deleteForm(formId: string): void {
    if (confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      this.formsService.deleteForm(formId).subscribe({
        next: () => {
          // Remove the form from the local array
          this.forms = this.forms.filter(form => form.id !== formId);
        },
        error: (error) => {
          console.error('Error deleting form:', error);
          alert('Failed to delete form. Please try again.');
        }
      });
    }
  }

  getFormCreatedDate(dateString: string | Date | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  }

  searchForms(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery = query;
    // In a real app, you might want to implement server-side search
    // For now, we'll just filter the forms client-side
  }

  get filteredForms(): Form[] {
    if (!this.searchQuery) return this.forms;
    return this.forms.filter(form => 
      form.name.toLowerCase().includes(this.searchQuery) || 
      (form.description?.toLowerCase().includes(this.searchQuery) || false)
    );
  }
}
