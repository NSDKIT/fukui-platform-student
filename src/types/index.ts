export interface User {
  id: string;
  email: string;
  role: 'monitor' | 'client' | 'admin' | 'support';
  name: string;
  created_at: string;
  profile?: MonitorProfile | ClientProfile;
}

export interface MonitorProfile {
  id: string;
  user_id: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  occupation: string;
  location: string;
  points: number;
  created_at: string;
  faculty?: string;
  department?: string;
  // Detailed profile fields
  gender_detail?: string;
  grade?: string;
  hometown?: string;
  school_name?: string;
  faculty_department?: string;
  interested_industries?: string[];
  interested_job_types?: string[];
  preferred_work_areas?: string[];
  company_selection_criteria_1?: string;
  company_selection_criteria_2?: string;
  company_selection_criteria_3?: string;
  important_benefits_1?: string;
  important_benefits_2?: string;
  important_benefits_3?: string;
  dealbreaker_points_1?: string;
  dealbreaker_points_2?: string;
  dealbreaker_points_3?: string;
  fulfilling_work_state?: string;
  job_hunting_start_time?: string;
  desired_company_info?: string;
  work_satisfaction_moments?: string;
  info_sources?: string;
  helpful_info_sources_1?: string;
  helpful_info_sources_2?: string;
  helpful_info_sources_3?: string;
  sns_company_account_usage?: string;
  memorable_sns_content?: string;
  frequently_used_sns?: string[];
  company_research_focus?: string;
  positive_selection_experience?: string;
  selection_improvement_suggestions?: string;
  memorable_recruitment_content?: string;
}

export interface ClientProfile {
  id: string;
  user_id: string;
  company_name: string;
  industry: string;
  created_at: string;
}

export interface ClientRegistrationCode {
  id: string;
  code: string;
  company_name: string;
  industry: string;
  is_used: boolean;
  used_by?: string;
  used_at?: string;
  created_at: string;
  created_by?: string;
}

export interface Survey {
  id: string;
  client_id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed';
  points_reward: number;
  created_at: string;
  updated_at: string;
  client?: User;
  questions: Question[];
  responses_count?: number;
}

export interface Question {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: 'text' | 'multiple_choice' | 'ranking';
  options?: string[];
  required: boolean;
  order_index: number;
  created_at: string;
  is_multiple_select?: boolean;
  max_selections?: number;
}

export interface Response {
  id: string;
  survey_id: string;
  monitor_id: string;
  answers: Answer[];
  completed_at: string;
  points_earned: number;
}

export interface Answer {
  question_id: string;
  answer_text?: string;
  answer_option?: string;
  answer_rating?: number;
  answer_boolean?: boolean;
}

export interface PointTransaction {
  id: string;
  monitor_id: string;
  survey_id: string;
  points: number;
  transaction_type: 'earned' | 'redeemed';
  created_at: string;
  survey?: Survey;
}

export interface PointExchangeRequest {
  id: string;
  monitor_id: string;
  exchange_type: 'paypay' | 'amazon' | 'starbucks';
  points_amount: number;
  status: 'pending' | 'completed' | 'rejected';
  contact_info: string;
  notes?: string;
  created_at: string;
  processed_at?: string;
}

export interface Advertisement {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  link_url?: string;
  is_active: boolean;
  display_order: number;
  target_regions?: string[];
  priority: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  creator?: User;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id?: string;
  room_id?: string;
  message: string;
  message_type: 'text' | 'image' | 'file';
  is_read: boolean;
  created_at: string;
  sender?: User;
  receiver?: User;
}

export interface ChatRoom {
  id: string;
  name?: string;
  room_type: 'direct' | 'group' | 'support';
  participants: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message?: ChatMessage;
}