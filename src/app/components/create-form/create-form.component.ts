import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsService } from '../../services/forms.service';
import { FormField, CreateFormDto, Form, FormWithFields, UpdateFormDto } from '../../models/form.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-create-form',
  templateUrl: './create-form.component.html',
  styleUrls: ['./create-form.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule]
})
export class CreateFormComponent implements OnInit {
  formFields: FormField[] = [];
  isCreatingForm = false;
  isEditMode = false;
  errorMessage = '';
  successMessage = '';
  selectedFieldIndex = -1;
  formName = 'Untitled Form';
  formDescription = '';
  formId: string | null = null;
  hasUnsavedChanges = false;
  isLoading = false;
  placeholder = 'Enter your name';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formsService: FormsService
  ) {}

  ngOnInit(): void {
    // Check if we're in edit mode and load form data if needed
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.formId = params['id'];
        this.isEditMode = true;
        if (this.formId) {
          this.loadFormData(this.formId);
        }
      }
    });
  }
  
  loadFormData(formId: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('Loading form data for ID:', formId);
    
    this.formsService.getFormWithFields(formId).subscribe({
      next: (response: FormWithFields) => {
        console.log('Form data loaded:', response);
        
        // Ensure we have a valid response
        if (response) {
          this.formName = response.name || 'Untitled Form';
          this.formDescription = response.description || '';
          this.formFields = response.fields || [];
          console.log('Form fields loaded:', this.formFields);
        } else {
          console.error('Invalid response format:', response);
          this.errorMessage = 'Failed to load form data. Invalid response format.';
        }
        
        this.isLoading = false;
        this.hasUnsavedChanges = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load form data. Please try again.';
        this.isLoading = false;
        console.error('Form loading error:', error);
      }
    });
  }

  addNewField(type: string): void {
    let options = null;
    let defaultLabel = `New ${type} field`;
    
    // Set appropriate default options for choice fields
    if (type === 'dropdown' || type === 'radio') {
      options = 'Option 1,Option 2,Option 3';
    } else if (type === 'checkbox') {
      options = 'Checkbox option';
    }
    
    const field: FormField = {
      form_id: this.formId || '', // Use existing form ID if in edit mode
      label: defaultLabel,
      field_type: type,
      required: false,
      options: options,
      order_number: this.formFields.length + 1
    };
    
    this.formFields.push(field);
    this.hasUnsavedChanges = true;
    
    // Automatically select the newly added field
    this.selectField(this.formFields.length - 1);
  }

  selectField(index: number): void {
    this.selectedFieldIndex = index;
  }
  
  onFieldChange(): void {
    this.hasUnsavedChanges = true;
  }

  deleteField(index: number): void {
    // If deleting the currently selected field, clear the selection
    if (this.selectedFieldIndex === index) {
      this.selectedFieldIndex = -1;
    } else if (this.selectedFieldIndex > index) {
      // If deleting a field before the selected one, adjust the index
      this.selectedFieldIndex--;
    }
    
    this.formFields.splice(index, 1);
    this.hasUnsavedChanges = true;
    
    // Update order numbers after deletion
    this.formFields.forEach((field, idx) => {
      field.order_number = idx + 1;
    });
  }

  hasFieldType(type: string): boolean {
    return this.formFields.some(field => field.field_type === type);
  }

  saveForm(): void {
    if (this.formFields.length === 0) {
      this.errorMessage = 'Please add at least one field to your form';
      return;
    }

    if (!this.formName || this.formName.trim() === '') {
      this.errorMessage = 'Please enter a form name';
      return;
    }

    this.isCreatingForm = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isEditMode && this.formId) {
      // Update existing form
      this.updateExistingForm();
    } else {
      // Create new form
      this.createNewForm();
    }
  }
  
  createNewForm(): void {
    const formData: CreateFormDto = {
      name: this.formName,
      description: this.formDescription || 'Form created using Formify',
      fields: this.formFields.map(field => ({
        ...field,
        form_id: '' // This will be set by the backend
      }))
    };

    this.formsService.createForm(formData).subscribe({
      next: (response) => {
        this.successMessage = 'Form published successfully!';
        this.isCreatingForm = false;
        this.hasUnsavedChanges = false;
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1500);
      },
      error: (error) => {
        this.errorMessage = 'Failed to publish form. Please try again.';
        this.isCreatingForm = false;
        console.error('Form creation error:', error);
      }
    });
  }
  
  updateExistingForm(): void {
    if (!this.formId) return;
    
    // Update form details
    const updateFormDto: UpdateFormDto = {
      name: this.formName,
      description: this.formDescription
    };
    
    this.formsService.updateForm(this.formId, updateFormDto).subscribe({
      next: (response) => {
        // Handle field updates
        // For simplicity, we'll delete all existing fields and create new ones
        // In a production app, you might want to do a more sophisticated diff
        this.updateFormFields();
      },
      error: (error) => {
        this.errorMessage = 'Failed to update form. Please try again.';
        this.isCreatingForm = false;
        console.error('Form update error:', error);
      }
    });
  }
  
  updateFormFields(): void {
    if (!this.formId) return;
    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('Updating form fields for form ID:', this.formId);
    console.log('New fields to save:', this.formFields);
    
    // Get existing fields to determine which ones to update/delete/create
    this.formsService.getFormFields(this.formId as string).subscribe({
      next: (existingFields) => {
        console.log('Existing fields:', existingFields);
        
        // For simplicity in this implementation, we'll delete all fields and recreate them
        // A more efficient approach would be to update existing fields and only add/delete as needed
        
        // Delete all existing fields first
        if (existingFields && existingFields.length > 0) {
          const deleteObservables = existingFields.map(field => {
            if (field.id) {
              console.log('Deleting field:', field.id, field.label);
              return this.formsService.deleteField(this.formId!, field.id).pipe(
                catchError(error => {
                  console.error('Field deletion error:', error);
                  return of(null); // Continue with other deletions even if one fails
                })
              );
            }
            return of(null); // Return an observable for consistency
          });
          
          // After all fields are deleted, create the new ones
          forkJoin(deleteObservables).subscribe({
            next: (results) => {
              console.log('Field deletion results:', results);
              this.createNewFields();
            },
            error: (error) => {
              this.errorMessage = 'Failed to update form fields. Please try again.';
              this.isCreatingForm = false;
              this.isLoading = false;
              console.error('Field deletion error:', error);
            }
          });
        } else {
          // No existing fields to delete, just create new ones
          this.createNewFields();
        }
      },
      error: (error) => {
        this.errorMessage = 'Failed to retrieve existing fields. Please try again.';
        this.isCreatingForm = false;
        this.isLoading = false;
        console.error('Field retrieval error:', error);
      }
    });
  }
  
  createNewFields(): void {
    // If no fields to add, we're done
    if (!this.formFields || this.formFields.length === 0) {
      this.finishUpdate();
      return;
    }
    
    console.log('Creating new fields for form ID:', this.formId);
    
    // Create observables for adding each field
    const addObservables = this.formFields.map((field, index) => {
      const fieldData = {
        label: field.label,
        field_type: field.field_type,
        required: field.required,
        options: field.options || undefined,
        order_number: index + 1,
        placeholder: field.placeholder || ''
      };
      
      console.log('Adding field:', fieldData);
      
      return this.formsService.addFieldToForm(this.formId!, fieldData).pipe(
        catchError(error => {
          console.error('Field update error:', error);
          return of(null); // Continue with other additions even if one fails
        })
      );
    });
    
    // Execute all field additions in parallel
    if (addObservables.length > 0) {
      forkJoin(addObservables).subscribe({
        next: (results) => {
          console.log('Field addition results:', results);
          this.finishUpdate();
        },
        error: (error) => {
          this.errorMessage = 'Failed to update form fields. Please try again.';
          this.isCreatingForm = false;
          this.isLoading = false;
          console.error('Field addition error:', error);
        }
      });
    } else {
      this.finishUpdate();
    }
  }
  
  finishUpdate(): void {
    this.successMessage = 'Form updated successfully!';
    this.isCreatingForm = false;
    this.isLoading = false;
    this.hasUnsavedChanges = false;
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 1500);
  }

  goBack(): void {
    // Check for unsaved changes
    if (this.hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        this.router.navigate(['/home']);
      }
    } else {
      this.router.navigate(['/home']);
    }
  }
}
