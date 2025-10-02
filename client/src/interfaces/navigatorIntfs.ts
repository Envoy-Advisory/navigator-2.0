export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'employer' | 'user';
    organization?: string;
    organizationId?: string;
    createdAt: Date;
    lastLogin: Date;
  };

  export interface Organization {
    id: string;
    name: string;
    members: string[];
    subscriptionType: 'basic' | 'premium' | 'enterprise';
    settings: {
      allowCollaboration: boolean;
      customBranding: boolean;
    };
  }; 

  export interface Module {
    id: string;
    title: string;
    description: string;
    icon: string;
    completed: boolean;
    locked: boolean;
    worksheets: Worksheet[];
    organizationType?: string;
    cohortId?: string;
  }
  
  export  interface Worksheet {
    id: string;
    moduleId: string;
    title: string;
    questions: Question[];
    responses: { [userId: string]: WorksheetResponse };
    isShared: boolean;
    lastModified: Date;
  }
  
  export interface Question {
    id: string;
    text: string;
    type: 'text' | 'textarea' | 'multiple_choice' | 'checkbox';
    options?: string[];
    required: boolean;
  }
  
  export interface WorksheetResponse {
    userId: string;
    answers: { [questionId: string]: string | string[] };
    completedAt?: Date;
    lastModified: Date;
  }
  
  export interface Testimonial {
    id: string;
    name: string;
    company: string;
    text: string;
    videoUrl?: string;
    rating: number;
  }
  
  // New interface for Form
  export interface Form {
    id: string;
    moduleId: string;
    formName: string;
    title?: string; // For backwards compatibility
    questions: FormQuestion[];
    responses?: { [userId: string]: FormResponse };
  }
  
  // New interface for FormQuestion
  export interface FormQuestion {
    id: string;
    text: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox'; // Added 'select' and 'checkbox'
    options?: string[];
    required: boolean;
  }
  
  // New interface for FormResponse
  export interface FormResponse {
    userId: string;
    answers: { [questionId: string]: string | string[] };
    submittedAt: Date;
  }

 export interface CMSModule {
    id: number;
    moduleNumber: number;
    moduleName: string;
    articles?: CMSArticle[];
  }
  
 export interface CMSArticle {
    id: number;
    moduleId: number;
    articleName: string;
    content: string;
    position?: number;
  }