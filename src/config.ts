// Email service configuration
// You can replace this with your preferred email service
export const EMAIL_CONFIG = {
  // Option 1: Formspree (free tier available)
  // Sign up at https://formspree.io and replace YOUR_FORM_ID with your actual form ID
  formspreeEndpoint: 'https://formspree.io/f/meokydqz',
  
  // Option 2: EmailJS (free tier available)
  // Sign up at https://www.emailjs.com and configure your service
  emailjsConfig: {
    serviceId: 'YOUR_SERVICE_ID',
    templateId: 'YOUR_TEMPLATE_ID',
    userId: 'YOUR_USER_ID'
  },
  
  // Option 3: Custom backend endpoint
  // If you have your own backend server
  customEndpoint: 'https://your-backend.com/api/send-message'
};

// Instructions for setting up email functionality:
// 1. For Formspree: Sign up at formspree.io, create a form, and replace YOUR_FORM_ID
// 2. For EmailJS: Sign up at emailjs.com, create a service and template, then update the config
// 3. For custom backend: Set up your own server endpoint and update customEndpoint 