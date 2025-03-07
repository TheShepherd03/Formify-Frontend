import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../shared/header/header.component';
import { environment } from '../../../environments/environment';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

interface Form {
  id: string;
  name: string;
  description: string;
  created_at: string;
  user_id: string;
}

interface FormSubmission {
  id: string;
  form_id: string;
  submitted_at: string;
}

interface FormField {
  id: string;
  form_id: string;
  label: string;
  field_type: string;
  required: boolean;
  options?: string;
  order_number: number;
  placeholder?: string;
}

interface SubmissionResponse {
  id: string;
  submission_id: string;
  field_id: string;
  response: string;
  form_fields: FormField;
}

interface SubmissionWithResponses {
  submission: FormSubmission;
  responses: SubmissionResponse[];
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit {
  forms: Form[] = [];
  selectedFormId: string | null = null;
  submissions: FormSubmission[] = [];
  submissionDetails: Map<string, SubmissionResponse[]> = new Map();
  fields: FormField[] = [];
  
  isLoading = true;
  error: string | null = null;
  
  dateFilter: { start: string, end: string } = {
    start: '',
    end: ''
  };
  
  submissionTimelineChart: Chart | null = null;
  fieldCompletionChart: Chart | null = null;
  responseDistributionCharts: Map<string, Chart> = new Map();
  
  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadForms();
    
    // Set default date range to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    this.dateFilter = {
      start: thirtyDaysAgo.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
    
    // Check if form ID is in the URL
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.selectedFormId = params['id'];
        if (this.selectedFormId) {
          this.loadFormData(this.selectedFormId);
        }
      }
    });
  }
  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  loadForms(): void {
    this.isLoading = true;
    this.http.get<Form[]>(`${environment.apiUrl}/forms`)
      .subscribe({
        next: (forms) => {
          this.forms = forms;
          this.isLoading = false;
          
          // If no form is selected and we have forms, select the first one
          if (!this.selectedFormId && this.forms.length > 0) {
            this.selectedFormId = this.forms[0].id;
            if (this.selectedFormId) {
              this.loadFormData(this.selectedFormId);
            }
          }
        },
        error: (err) => {
          this.error = 'Failed to load forms. Please try again.';
          this.isLoading = false;
          console.error('Error loading forms:', err);
        }
      });
  }
  
  loadFormData(formId: string): void {
    if (!formId) {
      this.error = 'No form selected.';
      this.isLoading = false;
      return;
    }
    this.isLoading = true;
    this.error = null;
    
    // Load form fields
    this.http.get<{ form: Form, fields: FormField[] }>(`${environment.apiUrl}/forms/${formId}/with-fields`)
      .subscribe({
        next: (data) => {
          this.fields = data.fields;
          this.loadSubmissions(formId);
        },
        error: (err) => {
          this.error = 'Failed to load form details. Please try again.';
          this.isLoading = false;
          console.error('Error loading form details:', err);
        }
      });
  }
  
  loadSubmissions(formId: string): void {
    this.http.get<FormSubmission[]>(`${environment.apiUrl}/forms/${formId}/submissions`)
      .subscribe({
        next: (submissions) => {
          this.submissions = this.filterSubmissionsByDate(submissions);
          
          // Clear previous submission details
          this.submissionDetails.clear();
          
          // If we have submissions, load details for each
          if (this.submissions.length > 0) {
            let loadedCount = 0;
            
            this.submissions.forEach(submission => {
              this.loadSubmissionDetails(submission.id, () => {
                loadedCount++;
                if (loadedCount === this.submissions.length) {
                  this.isLoading = false;
                  this.renderCharts();
                }
              });
            });
          } else {
            this.isLoading = false;
          }
        },
        error: (err) => {
          this.error = 'Failed to load form submissions. Please try again.';
          this.isLoading = false;
          console.error('Error loading submissions:', err);
        }
      });
  }
  
  loadSubmissionDetails(submissionId: string, callback: () => void): void {
    this.http.get<SubmissionWithResponses>(`${environment.apiUrl}/forms/submissions/${submissionId}`)
      .subscribe({
        next: (data) => {
          this.submissionDetails.set(submissionId, data.responses);
          callback();
        },
        error: (err) => {
          console.error(`Error loading submission ${submissionId} details:`, err);
          callback();
        }
      });
  }
  
  filterSubmissionsByDate(submissions: FormSubmission[]): FormSubmission[] {
    if (!this.dateFilter.start && !this.dateFilter.end) {
      return submissions;
    }
    
    return submissions.filter(submission => {
      const submissionDate = new Date(submission.submitted_at);
      const startDate = this.dateFilter.start ? new Date(this.dateFilter.start) : new Date(0);
      const endDate = this.dateFilter.end ? new Date(this.dateFilter.end) : new Date();
      
      // Set end date to end of day
      endDate.setHours(23, 59, 59, 999);
      
      return submissionDate >= startDate && submissionDate <= endDate;
    });
  }
  
  onFormChange(): void {
    if (this.selectedFormId) {
      this.router.navigate(['/analytics', this.selectedFormId]);
    }
  }
  
  onDateFilterChange(): void {
    if (this.selectedFormId) {
      this.loadFormData(this.selectedFormId);
    }
  }
  
  getResponseForField(submissionId: string, fieldId: string): string {
    const responses = this.submissionDetails.get(submissionId) || [];
    const response = responses.find(r => r.field_id === fieldId);
    return response?.response || '-';
  }
  
  exportToCsv(): void {
    if (!this.selectedFormId || this.submissions.length === 0) {
      return;
    }
    
    // Create CSV header row with field labels
    const headers = ['Submission ID', 'Submission Date', ...this.fields.map(field => field.label)];
    
    // Create rows for each submission
    const rows = this.submissions.map(submission => {
      const responses = this.submissionDetails.get(submission.id) || [];
      const row = [
        submission.id,
        new Date(submission.submitted_at).toLocaleString()
      ];
      
      // Add response for each field
      this.fields.forEach(field => {
        const response = responses.find(r => r.field_id === field.id);
        row.push(response ? response.response : '');
      });
      
      return row;
    });
    
    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `form-responses-${this.selectedFormId}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  
  renderCharts(): void {
    this.renderSubmissionTimelineChart();
    this.renderFieldCompletionChart();
    this.renderResponseDistributionCharts();
  }
  
  renderSubmissionTimelineChart(): void {
    if (this.submissionTimelineChart) {
      this.submissionTimelineChart.destroy();
    }
    
    const canvas = document.getElementById('submissionTimelineChart') as HTMLCanvasElement;
    if (!canvas || this.submissions.length === 0) {
      return;
    }
    
    // Group submissions by date
    const submissionsByDate = new Map<string, number>();
    
    this.submissions.forEach(submission => {
      const date = new Date(submission.submitted_at).toISOString().split('T')[0];
      submissionsByDate.set(date, (submissionsByDate.get(date) || 0) + 1);
    });
    
    // Sort dates
    const sortedDates = Array.from(submissionsByDate.keys()).sort();
    
    // Create chart data
    const chartData = {
      labels: sortedDates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString();
      }),
      datasets: [{
        label: 'Submissions',
        data: sortedDates.map(date => submissionsByDate.get(date) || 0),
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    };
    
    this.submissionTimelineChart = new Chart(canvas, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Submissions Over Time',
            font: {
              size: 16
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }
  
  renderFieldCompletionChart(): void {
    if (this.fieldCompletionChart) {
      this.fieldCompletionChart.destroy();
    }
    
    const canvas = document.getElementById('fieldCompletionChart') as HTMLCanvasElement;
    if (!canvas || this.submissions.length === 0 || this.fields.length === 0) {
      return;
    }
    
    // Calculate completion rate for each field
    const fieldCompletionRates = this.fields.map(field => {
      let completedCount = 0;
      
      this.submissions.forEach(submission => {
        const responses = this.submissionDetails.get(submission.id) || [];
        const response = responses.find(r => r.field_id === field.id);
        
        if (response && response.response && response.response.trim() !== '') {
          completedCount++;
        }
      });
      
      return {
        label: field.label,
        completionRate: (completedCount / this.submissions.length) * 100
      };
    });
    
    // Sort by completion rate (descending)
    fieldCompletionRates.sort((a, b) => b.completionRate - a.completionRate);
    
    // Create chart data
    const chartData = {
      labels: fieldCompletionRates.map(field => field.label),
      datasets: [{
        label: 'Completion Rate (%)',
        data: fieldCompletionRates.map(field => field.completionRate),
        backgroundColor: 'rgba(76, 175, 80, 0.7)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 1
      }]
    };
    
    this.fieldCompletionChart = new Chart(canvas, {
      type: 'bar',
      data: chartData,
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Field Completion Rates',
            font: {
              size: 16
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Completion Rate (%)'
            }
          }
        }
      }
    });
  }
  
  renderResponseDistributionCharts(): void {
    // Clear previous charts
    this.responseDistributionCharts.forEach(chart => chart.destroy());
    this.responseDistributionCharts.clear();
    
    // Only create distribution charts for choice fields (radio, checkbox, dropdown)
    const choiceFields = this.fields.filter(field => 
      ['radio', 'checkbox', 'dropdown'].includes(field.field_type) && field.options
    );
    
    choiceFields.forEach(field => {
      const canvasId = `responseDistribution-${field.id}`;
      const canvasContainer = document.getElementById('responseDistributionCharts');
      
      if (!canvasContainer) {
        return;
      }
      
      // Create canvas for this field if it doesn't exist
      let canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      if (!canvas) {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        
        const chartTitle = document.createElement('h3');
        chartTitle.textContent = field.label;
        chartContainer.appendChild(chartTitle);
        
        canvas = document.createElement('canvas');
        canvas.id = canvasId;
        chartContainer.appendChild(canvas);
        
        canvasContainer.appendChild(chartContainer);
      }
      
      // Count responses for each option
      const options = field.options?.split(',').map(opt => opt.trim()) || [];
      const optionCounts = new Map<string, number>();
      
      options.forEach(option => {
        optionCounts.set(option, 0);
      });
      
      // Count responses
      this.submissions.forEach(submission => {
        const responses = this.submissionDetails.get(submission.id) || [];
        const response = responses.find(r => r.field_id === field.id);
        
        if (response && response.response) {
          // Handle checkbox responses (comma-separated values)
          if (field.field_type === 'checkbox') {
            const selectedOptions = response.response.split(',').map(opt => opt.trim());
            selectedOptions.forEach(option => {
              if (optionCounts.has(option)) {
                optionCounts.set(option, (optionCounts.get(option) || 0) + 1);
              }
            });
          } else {
            // Handle radio and dropdown (single value)
            if (optionCounts.has(response.response)) {
              optionCounts.set(response.response, (optionCounts.get(response.response) || 0) + 1);
            }
          }
        }
      });
      
      // Create chart data
      const chartData = {
        labels: Array.from(optionCounts.keys()),
        datasets: [{
          data: Array.from(optionCounts.values()),
          backgroundColor: [
            'rgba(76, 175, 80, 0.7)',
            'rgba(46, 125, 50, 0.7)',
            'rgba(129, 199, 132, 0.7)',
            'rgba(200, 230, 201, 0.7)',
            'rgba(165, 214, 167, 0.7)',
            'rgba(102, 187, 106, 0.7)'
          ],
          borderWidth: 1
        }]
      };
      
      const chart = new Chart(canvas, {
        type: 'pie',
        data: chartData,
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'right'
            }
          }
        }
      });
      
      this.responseDistributionCharts.set(field.id, chart);
    });
  }
  
  getTotalSubmissions(): number {
    return this.submissions.length;
  }
  
  getCompletionRate(): number {
    if (this.submissions.length === 0 || this.fields.length === 0) {
      return 0;
    }
    
    let totalPossibleResponses = this.submissions.length * this.fields.length;
    let totalActualResponses = 0;
    
    this.submissions.forEach(submission => {
      const responses = this.submissionDetails.get(submission.id) || [];
      responses.forEach(response => {
        if (response.response && response.response.trim() !== '') {
          totalActualResponses++;
        }
      });
    });
    
    return (totalActualResponses / totalPossibleResponses) * 100;
  }
  
  getAverageFieldsPerSubmission(): number {
    if (this.submissions.length === 0) {
      return 0;
    }
    
    let totalFieldsCompleted = 0;
    
    this.submissions.forEach(submission => {
      const responses = this.submissionDetails.get(submission.id) || [];
      const completedResponses = responses.filter(
        response => response.response && response.response.trim() !== ''
      );
      
      totalFieldsCompleted += completedResponses.length;
    });
    
    return totalFieldsCompleted / this.submissions.length;
  }
}
