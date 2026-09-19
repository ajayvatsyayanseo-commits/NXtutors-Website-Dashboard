import type { Field } from './ProfileForm';

/**
 * The profile fields, matched one-for-one against the Blade forms they replace.
 *
 * The Blade tutor profile had five sections — personal, address, qualification,
 * documents, and the course picker — and the student profile a subset. Keeping
 * the same grouping means a tutor who knows the old screen finds everything
 * where they expect it.
 */

const GENDER: Field['options'] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const PERSONAL_FIELDS: Field[] = [
  { name: 'name', label: 'Full name' },
  { name: 'email', label: 'Email', type: 'email', help: 'Used for invoices and account recovery.' },
  { name: 'dob', label: 'Date of birth' },
  { name: 'gender', label: 'Gender', type: 'select', options: GENDER },
];

export const ADDRESS_FIELDS: Field[] = [
  { name: 'address', label: 'Address', type: 'textarea', placeholder: 'House, street, landmark' },
  { name: 'district', label: 'Locality or sector', placeholder: 'e.g. Sector 45' },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State' },
  { name: 'pincode', label: 'Pincode' },
];

export const LEARNING_FIELDS: Field[] = [
  { name: 'for_class', label: 'Class', placeholder: 'e.g. 10' },
  { name: 'class_type', label: 'Board', placeholder: 'e.g. CBSE' },
  {
    name: 'budget',
    label: 'Budget per class',
    placeholder: 'e.g. 900-1200',
    help: 'Matching uses this band, so a realistic range gets better matches than a low one.',
  },
];

export const QUALIFICATION_FIELDS: Field[] = [
  { name: 'education', label: 'Highest qualification', placeholder: 'e.g. M.Sc. Mathematics' },
  { name: 'other_education', label: 'Other qualifications', type: 'textarea' },
  {
    name: 'experience',
    label: 'Years of experience',
    placeholder: 'e.g. 8 years',
    help: 'Matching ranks experience for board classes.',
  },
];

export const ABOUT_FIELDS: Field[] = [
  {
    name: 'profile_desc',
    label: 'How you teach',
    type: 'textarea',
    help: 'The first thing a parent reads. Say what you do in a class, not how good you are.',
  },
  { name: 'profile', label: 'Headline', placeholder: 'One line under your name' },
  { name: 'pro_desc', label: 'Anything else', type: 'textarea' },
];

export const DOCUMENT_FIELDS: Field[] = [
  {
    name: 'document_type',
    label: 'Document type',
    type: 'select',
    options: [
      { value: 'Aadhar Card', label: 'Aadhar card' },
      { value: 'Driving Licence', label: 'Driving licence' },
      { value: 'Passport', label: 'Passport' },
      { value: 'Other', label: 'Other' },
    ],
  },
  {
    name: 'document_number',
    label: 'Document number',
    help: 'Stored privately for verification. It never appears on your public profile.',
  },
];
