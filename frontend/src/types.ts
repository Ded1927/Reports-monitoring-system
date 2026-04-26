export interface ControlOption {
  id: string;
  label: string;
  score_multiplier: number | null;
  order_num: number;
}

export interface TemplateControl {
  id: string;
  code: string | null;
  question_text: string;
  control_type: string;
  is_required: boolean;
  weight: number;
  order_num: number;
  options: ControlOption[];
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string | null;
  order_num: number;
  controls: TemplateControl[];
}

export interface TemplatePart {
  id: string;
  name: string;
  order_num: number;
  categories: TemplateCategory[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  type: string;
  version: string;
  is_active: boolean;
  parts: TemplatePart[];
}
