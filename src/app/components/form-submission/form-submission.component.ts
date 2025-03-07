import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsService } from '../../services/forms.service';
import { FormWithFields, SubmitFormDto, FormField } from '../../models/form.model';

@Component({
  selector: 'app-form-submission',
  templateUrl: './form-submission.component.html',
  styleUrls: ['./form-submission.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class FormSubmissionComponent implements OnInit {
  formId: string = '';
  form: FormWithFields | null = null;
  submissionForm: FormGroup;
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  showSummary: boolean = false;
  formSummary: {fieldId: string, label: string, value: string, type: string}[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private formsService: FormsService
  ) {
    this.submissionForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.formId = params['id'];
      this.loadForm();
    });
  }

  loadForm(): void {
    this.isLoading = true;
    this.formsService.getPublicForm(this.formId).subscribe({
      next: (form) => {
        this.form = form;
        // Sort fields by order_number to ensure they appear in the correct order
        if (this.form.fields) {
          this.form.fields.sort((a, b) => a.order_number - b.order_number);
        }
        this.buildForm();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load form. Please try again.';
        this.isLoading = false;
      }
    });
  }

  buildForm(): void {
    if (!this.form || !this.form.fields) return;

    const formControls: any = {};

    this.form.fields.forEach(field => {
      const validators = [];
      if (field.required) {
        validators.push(Validators.required);
      }

      if (field.field_type === 'email') {
        validators.push(Validators.email);
      }

      // Initialize form controls based on field type
      if (field.field_type === 'checkbox') {
        // For checkboxes, we need to handle multiple options
        const options = field.options?.split(',').map(opt => opt.trim()) || [];
        if (options.length > 0) {
          // Create an array of checkboxes for multiple options
          const checkboxGroup: any = {};
          options.forEach(option => {
            checkboxGroup[option] = [false, []]; // Default to unchecked
          });
          formControls[field.id!] = this.fb.group(checkboxGroup);
        } else {
          // Single checkbox
          formControls[field.id!] = [false, validators];
        }
      } else if (field.field_type === 'radio') {
        // For radio buttons, initialize with empty value
        // Make sure to set the name attribute in the HTML to group them
        formControls[field.id!] = ['', validators];
      } else {
        // For other field types
        formControls[field.id!] = ['', validators];
      }
    });

    this.submissionForm = this.fb.group(formControls);
    console.log('Form controls created:', this.submissionForm.controls);
  }

  updateCheckboxValue(fieldId: string, option: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const checkboxGroup = this.submissionForm.get(fieldId) as FormGroup;
    
    if (checkboxGroup && checkboxGroup.get(option)) {
      checkboxGroup.get(option)?.setValue(checkbox.checked);
    }
  }

  isCheckboxChecked(fieldId: string, option: string): boolean {
    const control = this.submissionForm.get(fieldId);
    if (control && control instanceof FormGroup && control.get(option)) {
      return control.get(option)?.value === true;
    }
    return false;
  }

  showFormSummary(): void {
    if (this.submissionForm.invalid) {
      Object.keys(this.submissionForm.controls).forEach(key => {
        const control = this.submissionForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
      return;
    }

    this.formSummary = [];
    if (!this.form || !this.form.fields) return;

    console.log('Form values:', this.submissionForm.value);

    // Build the summary data
    this.form.fields.forEach(field => {
      const value = this.submissionForm.value[field.id!];
      let displayValue = '';
      
      // Format the display value based on field type
      if (field.field_type === 'checkbox') {
        if (typeof value === 'boolean') {
          // Single checkbox
          displayValue = value ? 'Yes' : 'No';
        } else if (typeof value === 'object') {
          // Multiple checkboxes
          const selectedOptions = [];
          for (const option in value) {
            if (value[option]) {
              selectedOptions.push(option);
            }
          }
          displayValue = selectedOptions.join(', ') || 'None selected';
        }
      } else if (field.field_type === 'radio') {
        displayValue = value || 'None selected';
      } else if (field.field_type === 'date' && value) {
        const date = new Date(value);
        displayValue = date.toLocaleDateString();
      } else {
        displayValue = value !== null && value !== undefined ? value.toString() : '';
      }

      this.formSummary.push({
        fieldId: field.id!,
        label: field.label,
        value: displayValue,
        type: field.field_type
      });
    });

    this.showSummary = true;
  }

  editForm(): void {
    this.showSummary = false;
  }

  submitForm(): void {
    if (this.submissionForm.invalid) {
      Object.keys(this.submissionForm.controls).forEach(key => {
        const control = this.submissionForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
      return;
    }

    if (!this.showSummary) {
      this.showFormSummary();
      return;
    }

    this.isSubmitting = true;
    const formData: SubmitFormDto = {
      form_id: this.formId,
      responses: []
    };

    if (!this.form || !this.form.fields) return;

    // Process form values based on field type
    this.form.fields.forEach(field => {
      const fieldId = field.id!;
      let responseValue = '';

      if (field.field_type === 'checkbox') {
        const value = this.submissionForm.value[fieldId];
        if (typeof value === 'boolean') {
          // Single checkbox
          responseValue = value ? 'true' : 'false';
        } else if (typeof value === 'object') {
          // Multiple checkboxes
          const selectedOptions = [];
          for (const option in value) {
            if (value[option]) {
              selectedOptions.push(option);
            }
          }
          responseValue = selectedOptions.join(',');
        }
      } else if (field.field_type === 'radio') {
        // For radio buttons
        const value = this.submissionForm.value[fieldId];
        responseValue = value !== null && value !== undefined ? value.toString() : '';
        console.log(`Radio field ${fieldId} value:`, responseValue);
      } else {
        // For other field types
        const value = this.submissionForm.value[fieldId];
        responseValue = value !== null && value !== undefined ? value.toString() : '';
      }

      formData.responses.push({
        field_id: fieldId,
        response: responseValue
      });
    });

    console.log('Submitting form data:', formData);

    this.formsService.submitForm(this.formId, formData).subscribe({
      next: (submission) => {
        console.log('Form submission successful:', submission);
        this.isSubmitting = false;
        this.router.navigate(['/confirmation', submission.id]);
      },
      error: (error) => {
        console.error('Form submission error:', error);
        this.errorMessage = 'Failed to submit form. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  // Helper methods for the new UI organization
  hasFieldsOfType(types: string[]): boolean {
    if (!this.form || !this.form.fields) return false;
    return this.form.fields.some(field => types.includes(field.field_type));
  }

  getFieldsByType(types: string[]): FormField[] {
    if (!this.form || !this.form.fields) return [];
    return this.form.fields.filter(field => types.includes(field.field_type));
  }

  getFieldValue(fieldId: string): any {
    return this.submissionForm.get(fieldId)?.value;
  }

  isFieldInvalid(fieldId: string): boolean {
    const control = this.submissionForm.get(fieldId);
    return control ? (control.invalid && control.touched) : false;
  }

  goBack(): void {
    window.history.back();
  }
}
