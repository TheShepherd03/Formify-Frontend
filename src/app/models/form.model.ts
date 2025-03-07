export interface Form {
  id?: string;
  name: string;
  description: string;
  created_at?: Date;
  user_id?: string;
}

export interface FormField {
  id?: string;
  form_id: string;
  label: string;
  field_type: string;
  required: boolean;
  options?: string | null;
  order_number: number;
  created_at?: Date;
  placeholder?: string;
}

export interface FormWithFields extends Form {
  fields: FormField[];
}

export interface FormSubmission {
  id?: string;
  form_id: string;
  created_at?: Date;
  responses?: SubmissionResponse[];
}

export interface SubmissionResponse {
  id?: string;
  submission_id: string;
  field_id: string;
  response: string;
  created_at?: Date;
}

export interface SubmitFormDto {
  form_id: string;
  responses: {
    field_id: string;
    response: string;
  }[];
}

export interface CreateFormDto {
  name: string;
  description: string;
  fields: Omit<FormField, 'id' | 'form_id' | 'created_at'>[];
}

export interface UpdateFormDto {
  name?: string;
  description?: string;
}

export interface CreateFieldDto {
  label: string;
  field_type: string;
  required: boolean;
  options?: string;
  order_number: number;
  placeholder?: string;
}

export interface UpdateFieldDto {
  label?: string;
  field_type?: string;
  required?: boolean;
  options?: string;
  order_number?: number;
  placeholder?: string;
}
