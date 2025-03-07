import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  Form, 
  FormField, 
  FormWithFields, 
  FormSubmission, 
  SubmitFormDto, 
  CreateFormDto, 
  UpdateFormDto,
  CreateFieldDto,
  UpdateFieldDto
} from '../models/form.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FormsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Form CRUD operations
  getForms(): Observable<Form[]> {
    return this.http.get<Form[]>(`${this.apiUrl}/forms`);
  }

  getForm(id: string): Observable<Form> {
    return this.http.get<Form>(`${this.apiUrl}/forms/${id}`);
  }

  getFormWithFields(id: string): Observable<FormWithFields> {
    return this.http.get<{form: Form; fields: FormField[]}>(`${this.apiUrl}/forms/${id}/with-fields`)
      .pipe(
        map(response => {
          console.log('Raw response from backend:', response);
          if (!response || !response.form) {
            console.error('Invalid response format from backend:', response);
            throw new Error('Invalid response format from backend');
          }
          return {
            ...response.form,
            fields: response.fields || []
          };
        })
      );
  }
  
  getPublicForm(id: string): Observable<FormWithFields> {
    return this.http.get<{form: Form; fields: FormField[]}>(`${this.apiUrl}/forms/${id}/public`)
      .pipe(
        map(response => {
          console.log('Raw response from backend:', response);
          if (!response || !response.form) {
            console.error('Invalid response format from backend:', response);
            throw new Error('Invalid response format from backend');
          }
          return {
            ...response.form,
            fields: response.fields || []
          };
        })
      );
  }

  createForm(formData: CreateFormDto): Observable<FormWithFields> {
    return this.http.post<FormWithFields>(`${this.apiUrl}/forms`, formData);
  }

  updateForm(id: string, formData: UpdateFormDto): Observable<Form> {
    return this.http.patch<Form>(`${this.apiUrl}/forms/${id}`, formData);
  }

  deleteForm(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/forms/${id}`);
  }

  // Form fields operations
  getFormFields(formId: string): Observable<FormField[]> {
    return this.http.get<FormField[]>(`${this.apiUrl}/forms/${formId}/fields`);
  }

  addFieldToForm(formId: string, field: CreateFieldDto): Observable<FormField> {
    return this.http.post<FormField>(`${this.apiUrl}/forms/${formId}/fields`, field);
  }

  updateField(formId: string, fieldId: string, field: UpdateFieldDto): Observable<FormField> {
    return this.http.patch<FormField>(`${this.apiUrl}/forms/${formId}/fields/${fieldId}`, field);
  }

  deleteField(formId: string, fieldId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/forms/${formId}/fields/${fieldId}`);
  }
  
  // Helper method to convert Promise to Observable for compatibility
  toObservable<T>(promise: Promise<T>): Observable<T> {
    return new Observable<T>((observer) => {
      promise.then(
        (value) => {
          observer.next(value);
          observer.complete();
        },
        (error) => observer.error(error)
      );
    });
  }

  // Form submissions
  submitForm(formId: string, data: SubmitFormDto): Observable<FormSubmission> {
    return this.http.post<FormSubmission>(`${this.apiUrl}/forms/${formId}/submit`, data);
  }

  getFormSubmissions(formId: string): Observable<FormSubmission[]> {
    return this.http.get<FormSubmission[]>(`${this.apiUrl}/forms/${formId}/submissions`);
  }

  getSubmission(id: string): Observable<FormSubmission> {
    return this.http.get<FormSubmission>(`${this.apiUrl}/forms/submissions/${id}`);
  }
}
