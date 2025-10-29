import { Module, Testimonial, User, Worksheet, Question, FormResponse } from '../../interfaces/navigatorIntfs';

describe('Navigator Interfaces', () => {
  describe('User interface', () => {
    it('should create a valid User object', () => {
      const user: User = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        organizationId: 'org-1',
        createdAt: new Date('2023-01-01'),
        lastLogin: new Date('2023-01-15'),
      };

      expect(user.id).toBe('1');
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.role).toBe('user');
      expect(user.organizationId).toBe('org-1');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.lastLogin).toBeInstanceOf(Date);
    });

    it('should handle admin role', () => {
      const adminUser: User = {
        id: '2',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        organizationId: 'org-1',
        createdAt: new Date('2023-01-01'),
        lastLogin: new Date('2023-01-15'),
      };

      expect(adminUser.role).toBe('admin');
    });

    it('should handle optional organizationId', () => {
      const userWithoutOrg: User = {
        id: '3',
        name: 'User Without Org',
        email: 'user@example.com',
        role: 'user',
        organizationId: undefined,
        createdAt: new Date('2023-01-01'),
        lastLogin: new Date('2023-01-15'),
      };

      expect(userWithoutOrg.organizationId).toBeUndefined();
    });
  });

  describe('Module interface', () => {
    it('should create a valid Module object', () => {
      const module: Module = {
        id: 'planning',
        title: 'Planning',
        description: 'Strategic planning for inclusive hiring initiatives',
        icon: '📋',
        completed: false,
        locked: false,
        worksheets: [],
      };

      expect(module.id).toBe('planning');
      expect(module.title).toBe('Planning');
      expect(module.description).toBe('Strategic planning for inclusive hiring initiatives');
      expect(module.icon).toBe('📋');
      expect(module.completed).toBe(false);
      expect(module.locked).toBe(false);
      expect(module.worksheets).toEqual([]);
    });

    it('should handle completed and locked modules', () => {
      const completedModule: Module = {
        id: 'policies',
        title: 'Fair Chance Policies',
        description: 'Develop and implement fair chance hiring policies',
        icon: '⚖️',
        completed: true,
        locked: false,
        worksheets: [],
      };

      expect(completedModule.completed).toBe(true);
      expect(completedModule.locked).toBe(false);
    });
  });

  describe('Worksheet interface', () => {
    it('should create a valid Worksheet object', () => {
      const worksheet: Worksheet = {
        id: 'worksheet-1',
        moduleId: 'planning',
        title: 'Strategic Planning Assessment',
        questions: [],
        responses: {},
        isShared: false,
        lastModified: new Date('2023-01-15'),
      };

      expect(worksheet.id).toBe('worksheet-1');
      expect(worksheet.moduleId).toBe('planning');
      expect(worksheet.title).toBe('Strategic Planning Assessment');
      expect(worksheet.questions).toEqual([]);
      expect(worksheet.responses).toEqual({});
      expect(worksheet.isShared).toBe(false);
      expect(worksheet.lastModified).toBeInstanceOf(Date);
    });

    it('should handle shared worksheets', () => {
      const sharedWorksheet: Worksheet = {
        id: 'worksheet-2',
        moduleId: 'policies',
        title: 'Policy Development Checklist',
        questions: [],
        responses: {
          q1: {
            userId: 'q1',
            answers: {},
            lastModified: new Date('2023-01-16'),
          },
          q2: {
            userId: 'q2',
            answers: {},
            lastModified: new Date('2023-01-16'),
          }
        },
        isShared: true,
        lastModified: new Date('2023-01-16'),
      };

      expect(sharedWorksheet.isShared).toBe(true);
      expect(sharedWorksheet.responses).toEqual({
        q1: {
          userId: 'q1',
          answers: {},
          lastModified: new Date('2023-01-16'),
        },
        q2: {
          userId: 'q2',
          answers: {},
          lastModified: new Date('2023-01-16'),
        }
      });
    });
  });

  describe('Question interface', () => {
    it('should create a text question', () => {
      const textQuestion: Question = {
        id: 'q1',
        text: 'What are your current hiring challenges?',
        type: 'text',
        required: true,
      };

      expect(textQuestion.id).toBe('q1');
      expect(textQuestion.text).toBe('What are your current hiring challenges?');
      expect(textQuestion.type).toBe('text');
      expect(textQuestion.required).toBe(true);
    });

    it('should create a textarea question', () => {
      const textareaQuestion: Question = {
        id: 'q2',
        text: 'Describe your hiring process',
        type: 'textarea',
        required: false,
      };

      expect(textareaQuestion.type).toBe('textarea');
      expect(textareaQuestion.required).toBe(false);
    });

    it('should create a multiple choice question', () => {
      const multipleChoiceQuestion: Question = {
        id: 'q3',
        text: 'What is your organization size?',
        type: 'multiple_choice',
        options: ['Small (1-50)', 'Medium (51-200)', 'Large (200+)'],
        required: true,
      };

      expect(multipleChoiceQuestion.type).toBe('multiple_choice');
      expect(multipleChoiceQuestion.options).toEqual(['Small (1-50)', 'Medium (51-200)', 'Large (200+)']);
    });

    it('should handle optional question properties', () => {
      const optionalQuestion: Question = {
        id: 'q4',
        text: 'Additional comments',
        type: 'textarea',
        required: false,
      };

      expect(optionalQuestion.required).toBe(false);
      expect(optionalQuestion.options).toBeUndefined();
    });
  });

  describe('Testimonial interface', () => {
    it('should create a basic testimonial', () => {
      const testimonial: Testimonial = {
        id: '1',
        name: 'Sarah Johnson',
        company: 'TechCorp Solutions',
        text: 'Fair Chance Navigator transformed our hiring process.',
        rating: 5,
      };

      expect(testimonial.id).toBe('1');
      expect(testimonial.name).toBe('Sarah Johnson');
      expect(testimonial.company).toBe('TechCorp Solutions');
      expect(testimonial.text).toBe('Fair Chance Navigator transformed our hiring process.');
      expect(testimonial.rating).toBe(5);
    });

    it('should handle testimonials with video', () => {
      const testimonialWithVideo: Testimonial = {
        id: '2',
        name: 'Michael Chen',
        company: 'Green Industries',
        text: 'The step-by-step guidance made implementing fair chance policies straightforward.',
        videoUrl: 'https://example.com/video.mp4',
        rating: 5,
      };

      expect(testimonialWithVideo.videoUrl).toBe('https://example.com/video.mp4');
    });

    it('should handle different rating values', () => {
      const lowRatingTestimonial: Testimonial = {
        id: '3',
        name: 'Jane Doe',
        company: 'Company Inc',
        text: 'Good tool but could be improved.',
        rating: 3,
      };

      expect(lowRatingTestimonial.rating).toBe(3);
    });
  });

  describe('FormResponse interface', () => {
    it('should create a valid FormResponse object', () => {
      const formResponse = {
        id: 'response-1',
        formId: 'form-1',
        userId: 'user-1',
        responses: {
          q1: 'Answer 1',
          q2: 'Answer 2',
          q3: ['Option A', 'Option B'],
        },
        submittedAt: new Date('2023-01-15'),
        isDraft: false,
      };

      expect(formResponse.id).toBe('response-1');
      expect(formResponse.formId).toBe('form-1');
      expect(formResponse.userId).toBe('user-1');
      expect(formResponse.responses).toEqual({
        q1: 'Answer 1',
        q2: 'Answer 2',
        q3: ['Option A', 'Option B'],
      });
      expect(formResponse.submittedAt).toBeInstanceOf(Date);
    });

    it('should handle empty responses', () => {
      const emptyResponse: FormResponse = {
        userId: 'user-3',
        answers: {},
        submittedAt: new Date('2023-01-15'),
      };

      expect(emptyResponse.answers).toEqual({});
    });
  });

  describe('Interface type safety', () => {
    it('should enforce required properties', () => {
      // This test ensures TypeScript compilation works correctly
      const createUser = (): User => ({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        organizationId: 'org-1',
        createdAt: new Date(),
        lastLogin: new Date(),
      });

      const user = createUser();
      expect(user).toBeDefined();
    });

    it('should handle question type variants', () => {
      const questionTypes: Question['type'][] = ['text', 'textarea', 'multiple_choice'];
      
      questionTypes.forEach(type => {
        const question: Question = {
          id: 'test',
          text: 'Test question',
          type,
          required: false,
        };
        
        if (type === 'multiple_choice') {
          question.options = ['Option 1', 'Option 2'];
        }
        
        expect(question.type).toBe(type);
      });
    });
  });
});
