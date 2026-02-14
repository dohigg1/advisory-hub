// Pre-built assessment template fixtures for professional services firms

export type TemplateCategory = "consulting" | "accounting" | "advisory" | "technology" | "hr" | "compliance" | "operations";

export interface TemplateFixture {
  title: string;
  description: string;
  category: TemplateCategory;
  question_count: number;
  template_data_json: {
    type: string;
    settings_json: Record<string, any>;
    categories: { name: string; description: string; icon: string; colour: string; sort_order: number }[];
    questions: { category_index: number; type: string; text: string; help_text: string | null; is_required: boolean; sort_order: number; options?: { text: string; points: number; sort_order: number }[] }[];
    score_tiers: { label: string; min_pct: number; max_pct: number; colour: string; description: string; sort_order: number }[];
  };
}

function ratingOptions() {
  return [
    { text: "Strongly Disagree", points: 1, sort_order: 0 },
    { text: "Disagree", points: 2, sort_order: 1 },
    { text: "Neutral", points: 3, sort_order: 2 },
    { text: "Agree", points: 4, sort_order: 3 },
    { text: "Strongly Agree", points: 5, sort_order: 4 },
  ];
}

function scale5() {
  return [
    { text: "1", points: 1, sort_order: 0 },
    { text: "2", points: 2, sort_order: 1 },
    { text: "3", points: 3, sort_order: 2 },
    { text: "4", points: 4, sort_order: 3 },
    { text: "5", points: 5, sort_order: 4 },
  ];
}

function mc4(a: string, b: string, c: string, d: string) {
  return [
    { text: a, points: 1, sort_order: 0 },
    { text: b, points: 2, sort_order: 1 },
    { text: c, points: 3, sort_order: 2 },
    { text: d, points: 4, sort_order: 3 },
  ];
}

const defaultSettings = {
  lead_form_position: "before",
  show_progress_bar: true,
  allow_retakes: true,
  completion_message: "Thank you! Your results are ready.",
  lead_fields: {
    first_name: { enabled: true, required: true },
    last_name: { enabled: true, required: false },
    email: { enabled: true, required: true },
    company: { enabled: true, required: true },
    phone: { enabled: false, required: false },
  },
};

// ─── 1. DIGITAL MATURITY ────────────────────────────────────────
const digitalMaturity: TemplateFixture = {
  title: "Digital Maturity Assessment",
  description: "Evaluate digital transformation progress across strategy, CX, operations, data, and people. Ideal for consulting firms advising on digital strategy.",
  category: "consulting",
  question_count: 25,
  template_data_json: {
    type: "maturity_model",
    settings_json: { ...defaultSettings },
    categories: [
      { name: "Strategy & Leadership", description: "Digital vision, executive sponsorship, and strategic alignment", icon: "compass", colour: "#3B82F6", sort_order: 0 },
      { name: "Customer Experience", description: "Digital channels, personalisation, and customer journey", icon: "users", colour: "#8B5CF6", sort_order: 1 },
      { name: "Operations & Technology", description: "Automation, cloud adoption, and technology stack", icon: "settings", colour: "#10B981", sort_order: 2 },
      { name: "Data & Analytics", description: "Data governance, analytics, and data-driven decisions", icon: "bar-chart", colour: "#F59E0B", sort_order: 3 },
      { name: "People & Culture", description: "Digital skills, change readiness, and innovation culture", icon: "heart", colour: "#EF4444", sort_order: 4 },
    ],
    questions: [
      { category_index: 0, type: "multiple_choice", text: "How well-defined is your organisation's digital strategy?", help_text: null, is_required: true, sort_order: 0, options: mc4("No formal digital strategy exists", "Informal ideas but not documented", "Documented strategy but not widely communicated", "Clear strategy communicated and actively executed") },
      { category_index: 0, type: "multiple_choice", text: "What level of executive sponsorship exists for digital initiatives?", help_text: null, is_required: true, sort_order: 1, options: mc4("No dedicated executive sponsor", "Part-time sponsorship from IT leader", "Dedicated C-level sponsor", "CEO-led with board-level governance") },
      { category_index: 0, type: "rating_scale", text: "Rate the alignment between digital initiatives and business objectives.", help_text: null, is_required: true, sort_order: 2, options: scale5() },
      { category_index: 0, type: "multiple_choice", text: "How does your organisation allocate budget for digital transformation?", help_text: null, is_required: true, sort_order: 3, options: mc4("Ad-hoc funding with no dedicated budget", "Annual IT budget with some digital line items", "Dedicated digital transformation budget", "Strategic investment fund with agile allocation") },
      { category_index: 0, type: "multiple_choice", text: "How are digital initiatives measured and governed?", help_text: null, is_required: true, sort_order: 4, options: mc4("No formal measurement or governance", "Basic project tracking only", "KPI-driven with regular reviews", "Real-time dashboards with continuous improvement") },
      { category_index: 1, type: "multiple_choice", text: "How would you describe your digital customer channels?", help_text: null, is_required: true, sort_order: 5, options: mc4("Basic website only", "Website with some digital touchpoints", "Integrated multi-channel presence", "Omnichannel experience with seamless transitions") },
      { category_index: 1, type: "multiple_choice", text: "What level of personalisation do you offer customers digitally?", help_text: null, is_required: true, sort_order: 6, options: mc4("No personalisation", "Basic segmentation", "Behaviour-driven personalisation", "AI-driven hyper-personalisation") },
      { category_index: 1, type: "rating_scale", text: "Rate your ability to capture and act on customer feedback digitally.", help_text: null, is_required: true, sort_order: 7, options: scale5() },
      { category_index: 1, type: "multiple_choice", text: "How do you handle customer service through digital channels?", help_text: null, is_required: true, sort_order: 8, options: mc4("Phone and email only", "Web forms and basic FAQ", "Live chat and self-service portal", "AI chatbots with proactive support") },
      { category_index: 1, type: "multiple_choice", text: "Do you have a unified view of each customer across touchpoints?", help_text: null, is_required: true, sort_order: 9, options: mc4("No — data in separate systems", "Partially — some systems linked", "Mostly — CRM integrates key data", "Yes — single source of truth") },
      { category_index: 2, type: "multiple_choice", text: "What percentage of core business processes are digitised?", help_text: null, is_required: true, sort_order: 10, options: mc4("Less than 25%", "25-50%", "50-75%", "More than 75%") },
      { category_index: 2, type: "multiple_choice", text: "How would you describe your cloud adoption?", help_text: null, is_required: true, sort_order: 11, options: mc4("Primarily on-premises", "Some cloud services", "Cloud-first for new deployments", "Fully cloud-native architecture") },
      { category_index: 2, type: "rating_scale", text: "Rate the level of automation in your operational workflows.", help_text: null, is_required: true, sort_order: 12, options: scale5() },
      { category_index: 2, type: "multiple_choice", text: "How do your systems integrate with each other?", help_text: null, is_required: true, sort_order: 13, options: mc4("Manual data transfer", "Basic file-based integrations", "API-based integrations for key systems", "Fully integrated ecosystem with iPaaS") },
      { category_index: 2, type: "multiple_choice", text: "How do you approach cybersecurity?", help_text: null, is_required: true, sort_order: 14, options: mc4("Basic antivirus and firewalls", "Policies exist but inconsistently applied", "Comprehensive framework with regular audits", "Zero-trust with continuous monitoring") },
      { category_index: 3, type: "multiple_choice", text: "How would you describe your data governance?", help_text: null, is_required: true, sort_order: 15, options: mc4("No formal data governance", "Basic data ownership defined", "Formal governance framework", "Mature governance with stewardship and metrics") },
      { category_index: 3, type: "multiple_choice", text: "What analytics capabilities do you have?", help_text: null, is_required: true, sort_order: 16, options: mc4("Basic spreadsheet reporting", "Standard BI dashboards", "Advanced analytics with predictive models", "AI/ML-driven prescriptive analytics") },
      { category_index: 3, type: "rating_scale", text: "Rate how data-driven your decision-making process is.", help_text: null, is_required: true, sort_order: 17, options: scale5() },
      { category_index: 3, type: "multiple_choice", text: "How do you manage data quality?", help_text: null, is_required: true, sort_order: 18, options: mc4("No formal processes", "Periodic manual cleansing", "Automated validation and monitoring", "Continuous management with ML anomaly detection") },
      { category_index: 3, type: "multiple_choice", text: "How accessible is data to the people who need it?", help_text: null, is_required: true, sort_order: 19, options: mc4("Locked in silos", "Some self-service for key users", "Self-service for most employees", "Democratised with role-based governance") },
      { category_index: 4, type: "multiple_choice", text: "How would you describe the digital skills of your workforce?", help_text: null, is_required: true, sort_order: 20, options: mc4("Low digital literacy", "Pockets of expertise in IT", "Good skills across most functions", "Digitally fluent with continuous upskilling") },
      { category_index: 4, type: "multiple_choice", text: "How does your organisation approach innovation?", help_text: null, is_required: true, sort_order: 21, options: mc4("Not encouraged or rewarded", "Happens but not structured", "Formal innovation programmes", "Embedded in culture with dedicated resources") },
      { category_index: 4, type: "rating_scale", text: "Rate your organisation's readiness to embrace change.", help_text: null, is_required: true, sort_order: 22, options: scale5() },
      { category_index: 4, type: "multiple_choice", text: "Do you have a digital talent acquisition strategy?", help_text: null, is_required: true, sort_order: 23, options: mc4("No specific strategy", "Some roles designated as digital", "Proactive hiring with employer branding", "Comprehensive strategy with partnerships") },
      { category_index: 4, type: "multiple_choice", text: "How does leadership model digital behaviour?", help_text: null, is_required: true, sort_order: 24, options: mc4("Leaders rarely use digital tools", "Some leaders digitally active", "Most leaders champion digital adoption", "All leaders are digital role models") },
    ],
    score_tiers: [
      { label: "Nascent", min_pct: 0, max_pct: 25, colour: "#EF4444", description: "Your digital journey is just beginning. Foundational capabilities need establishing.", sort_order: 0 },
      { label: "Developing", min_pct: 26, max_pct: 50, colour: "#F59E0B", description: "Started building capabilities but significant gaps remain.", sort_order: 1 },
      { label: "Established", min_pct: 51, max_pct: 75, colour: "#3B82F6", description: "Good progress. Focus on integration and scaling.", sort_order: 2 },
      { label: "Leading", min_pct: 76, max_pct: 100, colour: "#10B981", description: "Digital leader. Maintain momentum through continuous innovation.", sort_order: 3 },
    ],
  },
};

// ─── 2. OPERATIONAL EFFICIENCY ──────────────────────────────────
const operationalEfficiency: TemplateFixture = {
  title: "Operational Efficiency Diagnostic",
  description: "Diagnose operational bottlenecks across process management, resource utilisation, quality control, supply chain, and continuous improvement.",
  category: "consulting",
  question_count: 20,
  template_data_json: {
    type: "diagnostic",
    settings_json: { ...defaultSettings },
    categories: [
      { name: "Process Management", description: "Standardisation, documentation, and optimisation", icon: "workflow", colour: "#3B82F6", sort_order: 0 },
      { name: "Resource Utilisation", description: "Workforce planning and capacity management", icon: "users", colour: "#8B5CF6", sort_order: 1 },
      { name: "Quality Control", description: "Quality standards and defect management", icon: "shield-check", colour: "#10B981", sort_order: 2 },
      { name: "Supply Chain", description: "Supplier management and logistics efficiency", icon: "truck", colour: "#F59E0B", sort_order: 3 },
      { name: "Continuous Improvement", description: "Lean practices and performance culture", icon: "trending-up", colour: "#EF4444", sort_order: 4 },
    ],
    questions: [
      { category_index: 0, type: "multiple_choice", text: "How well-documented are your core business processes?", help_text: null, is_required: true, sort_order: 0, options: mc4("Not documented — tribal knowledge", "Partially documented, often outdated", "Well-documented with regular reviews", "Living documentation with version control") },
      { category_index: 0, type: "multiple_choice", text: "How standardised are processes across teams/locations?", help_text: null, is_required: true, sort_order: 1, options: mc4("Each team has its own approach", "Some standard processes exist", "Most processes are standardised", "Fully standardised with controlled variation") },
      { category_index: 0, type: "rating_scale", text: "Rate the effectiveness of your workflow automation.", help_text: null, is_required: true, sort_order: 2, options: scale5() },
      { category_index: 0, type: "multiple_choice", text: "How do you identify and eliminate process bottlenecks?", help_text: null, is_required: true, sort_order: 3, options: mc4("We don't actively look", "Reactive — address when they cause issues", "Regular process reviews and mapping", "Continuous monitoring with automated alerts") },
      { category_index: 1, type: "multiple_choice", text: "How do you plan and allocate workforce resources?", help_text: null, is_required: true, sort_order: 4, options: mc4("Ad-hoc based on availability", "Basic scheduling with manual adjustments", "Capacity planning with forecasting", "Dynamic allocation with skills matching") },
      { category_index: 1, type: "rating_scale", text: "Rate your equipment/asset utilisation levels.", help_text: null, is_required: true, sort_order: 5, options: scale5() },
      { category_index: 1, type: "multiple_choice", text: "How do you handle capacity fluctuations?", help_text: null, is_required: true, sort_order: 6, options: mc4("Often over or under-staffed", "Use overtime and temporary staff", "Flexible staffing with cross-training", "Predictive planning with automated scaling") },
      { category_index: 1, type: "multiple_choice", text: "How visible is real-time resource utilisation data?", help_text: null, is_required: true, sort_order: 7, options: mc4("Not tracked", "Monthly reports", "Weekly dashboards", "Real-time visibility across all resources") },
      { category_index: 2, type: "multiple_choice", text: "Do you have formal quality standards in place?", help_text: null, is_required: true, sort_order: 8, options: mc4("No formal standards", "Basic quality guidelines", "Comprehensive standards with ISO or equiv.", "Industry-leading with continuous benchmarking") },
      { category_index: 2, type: "multiple_choice", text: "How do you track and manage defects or errors?", help_text: null, is_required: true, sort_order: 9, options: mc4("No formal tracking", "Manual logging after issues", "Systematic tracking with root cause analysis", "Predictive quality with automated detection") },
      { category_index: 2, type: "rating_scale", text: "Rate your customer satisfaction measurement capabilities.", help_text: null, is_required: true, sort_order: 10, options: scale5() },
      { category_index: 2, type: "multiple_choice", text: "How frequently do you conduct quality audits?", help_text: null, is_required: true, sort_order: 11, options: mc4("No formal audits", "Annual audits", "Quarterly audits with action plans", "Continuous monitoring with real-time dashboards") },
      { category_index: 3, type: "multiple_choice", text: "How do you manage supplier relationships?", help_text: null, is_required: true, sort_order: 12, options: mc4("Transactional with no formal management", "Basic vendor management with contracts", "Strategic partnerships with regular reviews", "Collaborative partnerships with shared KPIs") },
      { category_index: 3, type: "multiple_choice", text: "How optimised is your inventory management?", help_text: null, is_required: true, sort_order: 13, options: mc4("Manual tracking with frequent issues", "Basic inventory system", "Optimised with demand forecasting", "AI-driven with just-in-time fulfilment") },
      { category_index: 3, type: "rating_scale", text: "Rate your supply chain visibility end-to-end.", help_text: null, is_required: true, sort_order: 14, options: scale5() },
      { category_index: 3, type: "multiple_choice", text: "How resilient is your supply chain to disruption?", help_text: null, is_required: true, sort_order: 15, options: mc4("High single-source risk", "Some backup suppliers", "Diversified sourcing with BCP", "Stress-tested resilience with scenario planning") },
      { category_index: 4, type: "multiple_choice", text: "Do you use Lean, Six Sigma, or similar methodologies?", help_text: null, is_required: true, sort_order: 16, options: mc4("No formal methodology", "Some awareness but inconsistent", "Formal programme with trained practitioners", "Embedded culture with certified experts") },
      { category_index: 4, type: "multiple_choice", text: "How do employees contribute to improvement ideas?", help_text: null, is_required: true, sort_order: 17, options: mc4("No formal channel", "Suggestion box or annual survey", "Regular kaizen events or sprints", "Part of everyone's role with incentives") },
      { category_index: 4, type: "rating_scale", text: "Rate how effectively you measure and act on performance metrics.", help_text: null, is_required: true, sort_order: 18, options: scale5() },
      { category_index: 4, type: "multiple_choice", text: "How do you benchmark against industry peers?", help_text: null, is_required: true, sort_order: 19, options: mc4("No benchmarking", "Occasional comparisons", "Regular with defined metrics", "Continuous with competitive intelligence") },
    ],
    score_tiers: [
      { label: "Reactive", min_pct: 0, max_pct: 30, colour: "#EF4444", description: "Largely reactive with significant inefficiencies. Immediate attention required.", sort_order: 0 },
      { label: "Structured", min_pct: 31, max_pct: 55, colour: "#F59E0B", description: "Basic structures exist but room for significant improvement.", sort_order: 1 },
      { label: "Managed", min_pct: 56, max_pct: 80, colour: "#3B82F6", description: "Well-managed. Focus on automation and advanced optimisation.", sort_order: 2 },
      { label: "Optimised", min_pct: 81, max_pct: 100, colour: "#10B981", description: "Best-in-class operations with continuous improvement culture.", sort_order: 3 },
    ],
  },
};

// ─── 3. LEADERSHIP EFFECTIVENESS ────────────────────────────────
const leadershipEffectiveness: TemplateFixture = {
  title: "Leadership Effectiveness Scorecard",
  description: "Evaluate leadership capabilities across vision, communication, team development, decision making, change management, and results orientation.",
  category: "consulting",
  question_count: 30,
  template_data_json: {
    type: "scorecard",
    settings_json: { ...defaultSettings },
    categories: [
      { name: "Vision & Strategy", description: "Setting direction and inspiring towards a compelling future", icon: "eye", colour: "#3B82F6", sort_order: 0 },
      { name: "Communication", description: "Information sharing, listening, and influence", icon: "message-circle", colour: "#8B5CF6", sort_order: 1 },
      { name: "Team Development", description: "Growing, coaching, and empowering team members", icon: "users", colour: "#10B981", sort_order: 2 },
      { name: "Decision Making", description: "Quality, speed, and inclusivity of decisions", icon: "scale", colour: "#F59E0B", sort_order: 3 },
      { name: "Change Management", description: "Leading and sustaining organisational change", icon: "refresh-cw", colour: "#EC4899", sort_order: 4 },
      { name: "Results Orientation", description: "Focus on outcomes, accountability, and performance", icon: "target", colour: "#EF4444", sort_order: 5 },
    ],
    questions: (() => {
      const qs = [
        ["The leader clearly articulates a compelling vision.", "Strategic priorities are well-defined and communicated.", "Daily work is connected to the broader mission.", "Long-term thinking is balanced with short-term execution.", "Industry trends are anticipated and acted upon."],
        ["Communicates clearly and concisely.", "Active listening is demonstrated.", "Information is shared proactively and transparently.", "Communication style adapts to different audiences.", "Feedback is delivered constructively and regularly."],
        ["Invests time in coaching and mentoring.", "Career development conversations happen regularly.", "Team members are empowered to make decisions.", "High-potential talent is identified and developed.", "A psychologically safe environment is created."],
        ["Decisions are made in a timely manner.", "Appropriate input is gathered before deciding.", "Rationale behind decisions is clearly communicated.", "Calculated risks are taken when appropriate.", "Past decisions are reviewed and lessons applied."],
        ["The need for change is effectively communicated.", "Resistance to change is addressed constructively.", "Change initiatives are properly resourced.", "Momentum is maintained throughout change processes.", "Wins are celebrated and lessons captured."],
        ["Clear performance expectations are set.", "Progress towards goals is monitored regularly.", "Self and others are held accountable.", "Obstacles to performance are proactively removed.", "Excellence is recognised and rewarded consistently."],
      ];
      let sort = 0;
      const result: any[] = [];
      qs.forEach((catQs, catIdx) => {
        catQs.forEach(text => {
          result.push({ category_index: catIdx, type: "rating_scale", text, help_text: "1 = Strongly Disagree, 5 = Strongly Agree", is_required: true, sort_order: sort++, options: ratingOptions() });
        });
      });
      return result;
    })(),
    score_tiers: [
      { label: "Emerging", min_pct: 0, max_pct: 40, colour: "#EF4444", description: "Leadership capabilities in early development. Focus on core competencies.", sort_order: 0 },
      { label: "Developing", min_pct: 41, max_pct: 65, colour: "#F59E0B", description: "Good foundation with clear areas for growth.", sort_order: 1 },
      { label: "Effective", min_pct: 66, max_pct: 85, colour: "#3B82F6", description: "Strong leadership. Focus on mastery in weaker areas.", sort_order: 2 },
      { label: "Exceptional", min_pct: 86, max_pct: 100, colour: "#10B981", description: "Outstanding leadership. Consider mentoring others.", sort_order: 3 },
    ],
  },
};

// ─── 4. FINANCIAL HEALTH CHECK ──────────────────────────────────
const financialHealth: TemplateFixture = {
  title: "Financial Health Check",
  description: "Help SME clients understand their financial position across cash flow, tax planning, controls, compliance, and growth readiness.",
  category: "accounting",
  question_count: 20,
  template_data_json: {
    type: "diagnostic",
    settings_json: { ...defaultSettings, allow_retakes: true },
    categories: [
      { name: "Cash Flow Management", description: "Cash flow visibility, forecasting, and working capital", icon: "banknote", colour: "#10B981", sort_order: 0 },
      { name: "Tax Planning", description: "Tax efficiency, planning horizon, and compliance", icon: "calculator", colour: "#3B82F6", sort_order: 1 },
      { name: "Financial Controls", description: "Internal controls and fraud prevention", icon: "shield", colour: "#8B5CF6", sort_order: 2 },
      { name: "Compliance & Reporting", description: "Regulatory compliance and reporting quality", icon: "file-text", colour: "#F59E0B", sort_order: 3 },
      { name: "Growth Readiness", description: "Financial capacity for growth and scalability", icon: "trending-up", colour: "#EF4444", sort_order: 4 },
    ],
    questions: [
      { category_index: 0, type: "multiple_choice", text: "How far ahead can you forecast your cash flow?", help_text: null, is_required: true, sort_order: 0, options: mc4("We don't forecast cash flow", "1-4 weeks ahead", "1-3 months ahead", "3-12 months with scenario modelling") },
      { category_index: 0, type: "multiple_choice", text: "What is your average debtor days?", help_text: null, is_required: true, sort_order: 1, options: mc4("Over 60 days", "45-60 days", "30-45 days", "Under 30 days") },
      { category_index: 0, type: "multiple_choice", text: "How do you manage late payments from customers?", help_text: null, is_required: true, sort_order: 2, options: mc4("No formal process", "Manual chasing when we remember", "Structured credit control", "Automated reminders with escalation") },
      { category_index: 0, type: "rating_scale", text: "Rate your confidence in having enough cash for the next 3 months.", help_text: null, is_required: true, sort_order: 3, options: scale5() },
      { category_index: 1, type: "multiple_choice", text: "When do you discuss tax planning with your accountant?", help_text: null, is_required: true, sort_order: 4, options: mc4("Only at year-end", "Twice a year", "Quarterly reviews", "Ongoing proactive planning") },
      { category_index: 1, type: "multiple_choice", text: "Are you making use of all available tax reliefs?", help_text: null, is_required: true, sort_order: 5, options: mc4("I don't know what's available", "Probably miss opportunities", "Claim most available reliefs", "Comprehensive planning maximising all reliefs") },
      { category_index: 1, type: "multiple_choice", text: "How is your business structured for tax efficiency?", help_text: null, is_required: true, sort_order: 6, options: mc4("Never reviewed", "Reviewed once but not updated", "Reviewed periodically", "Optimised structure reviewed annually") },
      { category_index: 1, type: "rating_scale", text: "Rate your understanding of your tax obligations.", help_text: null, is_required: true, sort_order: 7, options: scale5() },
      { category_index: 2, type: "multiple_choice", text: "Do you have separation of duties for financial transactions?", help_text: null, is_required: true, sort_order: 8, options: mc4("One person handles everything", "Some separation but gaps exist", "Clear separation for most processes", "Full separation with documented controls") },
      { category_index: 2, type: "multiple_choice", text: "How are expenses and purchases authorised?", help_text: null, is_required: true, sort_order: 9, options: mc4("No formal authorisation process", "Informal approval by directors", "Defined approval limits and processes", "Automated workflows with multi-level approval") },
      { category_index: 2, type: "multiple_choice", text: "How frequently are bank reconciliations completed?", help_text: null, is_required: true, sort_order: 10, options: mc4("Quarterly or less", "Monthly", "Weekly", "Daily/real-time via bank feeds") },
      { category_index: 2, type: "rating_scale", text: "Rate your confidence that financial fraud would be detected quickly.", help_text: null, is_required: true, sort_order: 11, options: scale5() },
      { category_index: 3, type: "multiple_choice", text: "How up-to-date are your management accounts?", help_text: null, is_required: true, sort_order: 12, options: mc4("More than 3 months behind", "1-3 months behind", "Within 1 month", "Available within days of month-end") },
      { category_index: 3, type: "multiple_choice", text: "How do you handle regulatory filing deadlines?", help_text: null, is_required: true, sort_order: 13, options: mc4("Frequently miss deadlines", "Meet deadlines but last-minute", "Well-planned with comfortable margins", "Automated reminders with early submissions") },
      { category_index: 3, type: "rating_scale", text: "Rate the accuracy of your financial reporting.", help_text: null, is_required: true, sort_order: 14, options: scale5() },
      { category_index: 3, type: "multiple_choice", text: "Do you use cloud accounting software?", help_text: null, is_required: true, sort_order: 15, options: mc4("Paper-based or spreadsheets", "Desktop software", "Cloud software (basic)", "Full cloud stack with integrations") },
      { category_index: 4, type: "multiple_choice", text: "Could your financial systems handle 2x your current revenue?", help_text: null, is_required: true, sort_order: 16, options: mc4("No — they would break down", "Possibly but with significant strain", "Yes with some adjustments", "Yes — designed for scale") },
      { category_index: 4, type: "multiple_choice", text: "Do you have a financial model for growth scenarios?", help_text: null, is_required: true, sort_order: 17, options: mc4("No financial modelling", "Basic budget only", "Budget with some scenario analysis", "Detailed model with multiple scenarios") },
      { category_index: 4, type: "multiple_choice", text: "How would you fund significant growth?", help_text: null, is_required: true, sort_order: 18, options: mc4("Haven't considered funding", "Rely solely on retained profits", "Know our options", "Funding strategy with relationships established") },
      { category_index: 4, type: "rating_scale", text: "Rate your financial confidence for the next 12 months.", help_text: null, is_required: true, sort_order: 19, options: scale5() },
    ],
    score_tiers: [
      { label: "At Risk", min_pct: 0, max_pct: 35, colour: "#EF4444", description: "Significant financial vulnerabilities. Urgent attention needed.", sort_order: 0 },
      { label: "Developing", min_pct: 36, max_pct: 60, colour: "#F59E0B", description: "Some good practices but notable gaps.", sort_order: 1 },
      { label: "Healthy", min_pct: 61, max_pct: 80, colour: "#3B82F6", description: "Strong financial management. Focus on optimisation.", sort_order: 2 },
      { label: "Excellent", min_pct: 81, max_pct: 100, colour: "#10B981", description: "Outstanding. Well-positioned for growth.", sort_order: 3 },
    ],
  },
};

// ─── 5. MTD READINESS ───────────────────────────────────────────
const mtdReadiness: TemplateFixture = {
  title: "MTD Readiness Assessment",
  description: "UK-specific Making Tax Digital preparedness assessment. Helps accounting firms identify clients needing MTD compliance support.",
  category: "accounting",
  question_count: 15,
  template_data_json: {
    type: "readiness_check",
    settings_json: { ...defaultSettings, allow_retakes: false },
    categories: [
      { name: "Software & Systems", description: "MTD-compatible software and technology", icon: "monitor", colour: "#3B82F6", sort_order: 0 },
      { name: "Record Keeping", description: "Digital record keeping and data quality", icon: "database", colour: "#10B981", sort_order: 1 },
      { name: "Digital Links", description: "Automated data flows", icon: "link", colour: "#8B5CF6", sort_order: 2 },
      { name: "Filing Process", description: "VAT return preparation and submission", icon: "send", colour: "#F59E0B", sort_order: 3 },
      { name: "Team Capability", description: "Staff knowledge with MTD processes", icon: "graduation-cap", colour: "#EF4444", sort_order: 4 },
    ],
    questions: [
      { category_index: 0, type: "multiple_choice", text: "What accounting software do you currently use?", help_text: null, is_required: true, sort_order: 0, options: mc4("Spreadsheets only", "Desktop software (non-MTD compatible)", "MTD-compatible software (basic)", "Fully MTD-compatible cloud software") },
      { category_index: 0, type: "multiple_choice", text: "Is your software on HMRC's recognised MTD-compatible list?", help_text: null, is_required: true, sort_order: 1, options: [{ text: "No", points: 0, sort_order: 0 }, { text: "Yes", points: 4, sort_order: 1 }] },
      { category_index: 0, type: "multiple_choice", text: "How integrated is your accounting software with other systems?", help_text: null, is_required: true, sort_order: 2, options: mc4("Standalone — manual entry", "Some bank feeds", "Bank feeds plus integrations", "Fully integrated ecosystem") },
      { category_index: 1, type: "multiple_choice", text: "How do you maintain your financial records?", help_text: null, is_required: true, sort_order: 3, options: mc4("Paper-based", "Mix of paper and digital", "Primarily digital", "Fully digital records") },
      { category_index: 1, type: "multiple_choice", text: "How often do you update your financial records?", help_text: null, is_required: true, sort_order: 4, options: mc4("Quarterly or less", "Monthly", "Weekly", "Real-time") },
      { category_index: 1, type: "rating_scale", text: "Rate the accuracy of your digital records.", help_text: null, is_required: true, sort_order: 5, options: scale5() },
      { category_index: 2, type: "multiple_choice", text: "Do you use copy-paste or manual re-keying between systems?", help_text: "Under MTD, manual data transfer is not permitted", is_required: true, sort_order: 6, options: mc4("Yes — extensively", "Yes — for some transfers", "Rarely — most automated", "Never — all digital links") },
      { category_index: 2, type: "multiple_choice", text: "Can data flow from invoicing to accounting without manual intervention?", help_text: null, is_required: true, sort_order: 7, options: [{ text: "No", points: 0, sort_order: 0 }, { text: "Yes", points: 4, sort_order: 1 }] },
      { category_index: 2, type: "multiple_choice", text: "If you use spreadsheets in your VAT process, are they digitally linked?", help_text: null, is_required: true, sort_order: 8, options: [{ text: "Spreadsheets with manual copy-paste", points: 1, sort_order: 0 }, { text: "We use bridging software", points: 3, sort_order: 1 }, { text: "No spreadsheets in our VAT process", points: 4, sort_order: 2 }] },
      { category_index: 3, type: "multiple_choice", text: "How do you currently submit your VAT returns?", help_text: null, is_required: true, sort_order: 9, options: [{ text: "Manual entry on HMRC website", points: 1, sort_order: 0 }, { text: "Via accountant (unsure of method)", points: 2, sort_order: 1 }, { text: "Direct submission from software (API)", points: 4, sort_order: 2 }] },
      { category_index: 3, type: "multiple_choice", text: "Have you successfully submitted a VAT return via MTD?", help_text: null, is_required: true, sort_order: 10, options: mc4("No — haven't attempted", "Attempted but had issues", "Yes — with some difficulties", "Yes — smooth process") },
      { category_index: 3, type: "rating_scale", text: "Rate your confidence in your VAT filing process.", help_text: null, is_required: true, sort_order: 11, options: scale5() },
      { category_index: 4, type: "multiple_choice", text: "How familiar is your finance team with MTD requirements?", help_text: null, is_required: true, sort_order: 12, options: mc4("Not aware", "Basic awareness", "Good understanding", "Expert knowledge with training") },
      { category_index: 4, type: "multiple_choice", text: "Has your team received MTD-specific training?", help_text: null, is_required: true, sort_order: 13, options: mc4("No training", "Self-taught from online resources", "Formal training completed", "Formal training with regular refreshers") },
      { category_index: 4, type: "rating_scale", text: "Rate your team's confidence in handling MTD independently.", help_text: null, is_required: true, sort_order: 14, options: scale5() },
    ],
    score_tiers: [
      { label: "Not Ready", min_pct: 0, max_pct: 40, colour: "#EF4444", description: "Significant gaps. Immediate action needed to avoid penalties.", sort_order: 0 },
      { label: "Partially Ready", min_pct: 41, max_pct: 65, colour: "#F59E0B", description: "Foundations in place but key areas need addressing.", sort_order: 1 },
      { label: "Mostly Ready", min_pct: 66, max_pct: 85, colour: "#3B82F6", description: "Good progress. A few refinements needed.", sort_order: 2 },
      { label: "Fully Ready", min_pct: 86, max_pct: 100, colour: "#10B981", description: "Excellent MTD readiness.", sort_order: 3 },
    ],
  },
};

// ─── 6. ADVISORY SERVICES NEEDS ─────────────────────────────────
const advisoryNeeds: TemplateFixture = {
  title: "Advisory Services Needs Analysis",
  description: "Help accountants identify which advisory services their clients would benefit from most. Results map to specific service recommendations.",
  category: "accounting",
  question_count: 18,
  template_data_json: {
    type: "diagnostic",
    settings_json: { ...defaultSettings, allow_retakes: false },
    categories: [
      { name: "Current Pain Points", description: "Key challenges in financial management", icon: "alert-triangle", colour: "#EF4444", sort_order: 0 },
      { name: "Growth Ambitions", description: "Business growth plans and support needed", icon: "rocket", colour: "#3B82F6", sort_order: 1 },
      { name: "Technology Adoption", description: "Use of financial technology and automation", icon: "cpu", colour: "#8B5CF6", sort_order: 2 },
      { name: "Financial Complexity", description: "Complexity of financial structure and reporting", icon: "git-branch", colour: "#F59E0B", sort_order: 3 },
    ],
    questions: [
      { category_index: 0, type: "multiple_choice", text: "What is your biggest financial management challenge?", help_text: null, is_required: true, sort_order: 0, options: mc4("Cash flow unpredictability", "Understanding our financial position", "Tax compliance complexity", "Making informed business decisions") },
      { category_index: 0, type: "rating_scale", text: "How much time do you personally spend on financial admin?", help_text: "1 = too little attention, 5 = too much time", is_required: true, sort_order: 1, options: scale5() },
      { category_index: 0, type: "multiple_choice", text: "How often do financial surprises catch you off guard?", help_text: null, is_required: true, sort_order: 2, options: mc4("Rarely", "Occasionally", "Regularly", "Frequently") },
      { category_index: 0, type: "multiple_choice", text: "Do you feel you're paying more tax than necessary?", help_text: null, is_required: true, sort_order: 3, options: mc4("No — our position is optimised", "Possibly — unsure where savings are", "Probably — we know there are opportunities", "Definitely — need urgent review") },
      { category_index: 0, type: "rating_scale", text: "Rate your stress level around financial management.", help_text: null, is_required: true, sort_order: 4, options: scale5() },
      { category_index: 1, type: "multiple_choice", text: "What are your growth plans for the next 2-3 years?", help_text: null, is_required: true, sort_order: 5, options: mc4("Maintain current size", "Modest organic growth (10-20%)", "Significant growth (20-50%)", "Rapid growth or acquisition") },
      { category_index: 1, type: "multiple_choice", text: "Do you need funding for growth?", help_text: null, is_required: true, sort_order: 6, options: mc4("No — self-funded", "Possibly — exploring options", "Yes — need help identifying sources", "Yes — actively seeking funding") },
      { category_index: 1, type: "multiple_choice", text: "Are you considering major business changes?", help_text: null, is_required: true, sort_order: 7, options: mc4("No significant changes", "New products or markets", "Restructuring or partnerships", "Sale, merger, or succession") },
      { category_index: 1, type: "rating_scale", text: "Rate how prepared you feel financially for growth.", help_text: null, is_required: true, sort_order: 8, options: scale5() },
      { category_index: 2, type: "multiple_choice", text: "What accounting/finance software do you use?", help_text: null, is_required: true, sort_order: 9, options: mc4("Spreadsheets", "Desktop software", "Cloud software (basic)", "Cloud with multiple integrations") },
      { category_index: 2, type: "multiple_choice", text: "How automated are your financial processes?", help_text: null, is_required: true, sort_order: 10, options: mc4("Mostly manual", "Some automation", "Mostly automated", "Fully automated with exception handling") },
      { category_index: 2, type: "rating_scale", text: "Rate your openness to adopting new financial technology.", help_text: null, is_required: true, sort_order: 11, options: scale5() },
      { category_index: 2, type: "multiple_choice", text: "Do you use financial dashboards or reporting tools?", help_text: null, is_required: true, sort_order: 12, options: mc4("No — paper reports", "Basic reports from software", "Custom dashboards with key metrics", "Real-time dashboards with alerts") },
      { category_index: 3, type: "multiple_choice", text: "How many entities or companies do you operate?", help_text: null, is_required: true, sort_order: 13, options: mc4("Single entity", "2-3 entities", "4-10 entities", "10+ or international operations") },
      { category_index: 3, type: "multiple_choice", text: "How many employees do you have?", help_text: null, is_required: true, sort_order: 14, options: mc4("1-10", "11-50", "51-200", "200+") },
      { category_index: 3, type: "multiple_choice", text: "What is your approximate annual turnover?", help_text: null, is_required: true, sort_order: 15, options: mc4("Under £500k", "£500k - £2m", "£2m - £10m", "Over £10m") },
      { category_index: 3, type: "multiple_choice", text: "Do you have international transactions?", help_text: null, is_required: true, sort_order: 16, options: mc4("No — purely domestic", "Some imports/exports", "Regular international trade", "Multi-country operations") },
      { category_index: 3, type: "rating_scale", text: "Rate the complexity of your financial reporting requirements.", help_text: null, is_required: true, sort_order: 17, options: scale5() },
    ],
    score_tiers: [
      { label: "Basic Needs", min_pct: 0, max_pct: 30, colour: "#10B981", description: "Straightforward needs. Core compliance services recommended.", sort_order: 0 },
      { label: "Growing Needs", min_pct: 31, max_pct: 55, colour: "#3B82F6", description: "Would benefit from proactive advisory services.", sort_order: 1 },
      { label: "Complex Needs", min_pct: 56, max_pct: 80, colour: "#F59E0B", description: "Requires comprehensive advisory support.", sort_order: 2 },
      { label: "Strategic Needs", min_pct: 81, max_pct: 100, colour: "#EF4444", description: "Needs strategic financial advisor or CFO-as-a-service.", sort_order: 3 },
    ],
  },
};

// ─── 7. CLIENT ONBOARDING ───────────────────────────────────────
const clientOnboarding: TemplateFixture = {
  title: "Client Onboarding Diagnostic",
  description: "Structured questionnaire for advisory firms to understand new clients' business, finances, priorities, and risk profile.",
  category: "advisory",
  question_count: 20,
  template_data_json: {
    type: "diagnostic",
    settings_json: { ...defaultSettings, allow_retakes: false },
    categories: [
      { name: "Business Overview", description: "Industry, size, stage, and structure", icon: "building", colour: "#3B82F6", sort_order: 0 },
      { name: "Financial Position", description: "Current financial health and metrics", icon: "trending-up", colour: "#10B981", sort_order: 1 },
      { name: "Goals & Priorities", description: "Short and long-term objectives", icon: "target", colour: "#8B5CF6", sort_order: 2 },
      { name: "Risk Profile", description: "Risk appetite and management", icon: "shield", colour: "#F59E0B", sort_order: 3 },
      { name: "Service Requirements", description: "Current and desired professional services", icon: "briefcase", colour: "#EF4444", sort_order: 4 },
    ],
    questions: [
      { category_index: 0, type: "multiple_choice", text: "What stage is your business at?", help_text: null, is_required: true, sort_order: 0, options: mc4("Start-up (0-2 years)", "Growth (2-5 years)", "Established (5-15 years)", "Mature (15+ years)") },
      { category_index: 0, type: "multiple_choice", text: "How many employees do you have?", help_text: null, is_required: true, sort_order: 1, options: mc4("Solo / 1-5", "6-20", "21-100", "100+") },
      { category_index: 0, type: "multiple_choice", text: "What is your business structure?", help_text: null, is_required: true, sort_order: 2, options: mc4("Sole trader", "Partnership", "Limited company", "Group of companies") },
      { category_index: 0, type: "open_text", text: "Briefly describe your business and industry.", help_text: null, is_required: true, sort_order: 3 },
      { category_index: 1, type: "multiple_choice", text: "What is your approximate annual revenue?", help_text: null, is_required: true, sort_order: 4, options: mc4("Under £250k", "£250k - £1m", "£1m - £5m", "Over £5m") },
      { category_index: 1, type: "multiple_choice", text: "How would you describe your current profitability?", help_text: null, is_required: true, sort_order: 5, options: mc4("Making a loss", "Breaking even", "Moderately profitable", "Highly profitable") },
      { category_index: 1, type: "rating_scale", text: "Rate your overall financial health.", help_text: null, is_required: true, sort_order: 6, options: scale5() },
      { category_index: 1, type: "multiple_choice", text: "Do you have outstanding loans or debt?", help_text: null, is_required: true, sort_order: 7, options: [{ text: "No debt", points: 4, sort_order: 0 }, { text: "Manageable debt", points: 3, sort_order: 1 }, { text: "Significant but controlled", points: 2, sort_order: 2 }, { text: "Concerning levels", points: 1, sort_order: 3 }] },
      { category_index: 2, type: "multiple_choice", text: "What is your primary goal for the next 12 months?", help_text: null, is_required: true, sort_order: 8, options: mc4("Survival / stability", "Cost reduction", "Revenue growth", "Market expansion") },
      { category_index: 2, type: "multiple_choice", text: "What is your 3-5 year vision?", help_text: null, is_required: true, sort_order: 9, options: mc4("Maintain current position", "Steady growth", "Significant scaling", "Exit or succession") },
      { category_index: 2, type: "rating_scale", text: "How clear is your strategic plan?", help_text: null, is_required: true, sort_order: 10, options: scale5() },
      { category_index: 2, type: "open_text", text: "What keeps you up at night about your business?", help_text: null, is_required: false, sort_order: 11 },
      { category_index: 3, type: "multiple_choice", text: "How would you describe your risk appetite?", help_text: null, is_required: true, sort_order: 12, options: mc4("Very conservative", "Cautious", "Balanced", "Aggressive") },
      { category_index: 3, type: "multiple_choice", text: "Do you have business insurance in place?", help_text: null, is_required: true, sort_order: 13, options: mc4("No insurance", "Basic only", "Comprehensive cover", "Fully reviewed and optimised") },
      { category_index: 3, type: "rating_scale", text: "Rate your confidence in business continuity planning.", help_text: null, is_required: true, sort_order: 14, options: scale5() },
      { category_index: 3, type: "multiple_choice", text: "Have you identified your key business risks?", help_text: null, is_required: true, sort_order: 15, options: mc4("No risk assessment done", "Informal awareness", "Documented risk register", "Active management with mitigation plans") },
      { category_index: 4, type: "multiple_choice", text: "What level of advisory support do you currently receive?", help_text: null, is_required: true, sort_order: 16, options: mc4("Compliance only", "Some proactive advice", "Regular advisory meetings", "Full strategic advisory") },
      { category_index: 4, type: "multiple_choice", text: "How often do you want to meet with your advisor?", help_text: null, is_required: true, sort_order: 17, options: mc4("Annually", "Quarterly", "Monthly", "Weekly or on-demand") },
      { category_index: 4, type: "rating_scale", text: "Rate your satisfaction with current professional advisors.", help_text: null, is_required: true, sort_order: 18, options: scale5() },
      { category_index: 4, type: "open_text", text: "What specific help are you looking for from an advisor?", help_text: null, is_required: false, sort_order: 19 },
    ],
    score_tiers: [
      { label: "Simple Profile", min_pct: 0, max_pct: 30, colour: "#10B981", description: "Straightforward client. Standard service package.", sort_order: 0 },
      { label: "Moderate Profile", min_pct: 31, max_pct: 55, colour: "#3B82F6", description: "Growing complexity requiring proactive support.", sort_order: 1 },
      { label: "Complex Profile", min_pct: 56, max_pct: 80, colour: "#F59E0B", description: "Significant complexity. Monthly engagement recommended.", sort_order: 2 },
      { label: "Strategic Profile", min_pct: 81, max_pct: 100, colour: "#EF4444", description: "High-value strategic client. Consider CFO advisory retainer.", sort_order: 3 },
    ],
  },
};

// ─── 8. CHANGE READINESS ────────────────────────────────────────
const changeReadiness: TemplateFixture = {
  title: "Change Readiness Assessment",
  description: "Assess organisational readiness to implement and sustain change across leadership, communication, engagement, capability, and culture.",
  category: "advisory",
  question_count: 25,
  template_data_json: {
    type: "readiness_check",
    settings_json: { ...defaultSettings },
    categories: [
      { name: "Leadership Commitment", description: "Visible support and active sponsorship", icon: "crown", colour: "#3B82F6", sort_order: 0 },
      { name: "Communication", description: "Quality and effectiveness of change comms", icon: "megaphone", colour: "#8B5CF6", sort_order: 1 },
      { name: "Employee Engagement", description: "Workforce involvement and buy-in", icon: "heart", colour: "#10B981", sort_order: 2 },
      { name: "Resources & Capability", description: "Skills, tools, and capacity to deliver", icon: "wrench", colour: "#F59E0B", sort_order: 3 },
      { name: "Culture", description: "Organisational culture alignment with change", icon: "flame", colour: "#EF4444", sort_order: 4 },
    ],
    questions: (() => {
      const qs = [
        ["Senior leaders actively champion the need for change.", "Leadership has a clear and shared vision.", "Resources have been allocated to support the initiative.", "Leaders model the behaviours they expect.", "There is accountability at leadership level for outcomes."],
        ["The reasons for change have been clearly communicated.", "Employees understand how change affects their roles.", "Two-way communication channels exist for feedback.", "Communication is timely, transparent, and consistent.", "Success stories and quick wins are shared regularly."],
        ["Employees have been involved in shaping the change.", "There is general willingness to try new ways of working.", "Change champions exist across the organisation.", "Concerns and resistance are addressed constructively.", "Employees trust the change is in their best interest."],
        ["Employees have the skills needed for new ways of working.", "Training and development is available for the transition.", "Sufficient time is allocated for learning and adapting.", "Technology and tools support new processes.", "Dedicated change management resources are available."],
        ["The organisation has successfully delivered change before.", "Innovation and experimentation are encouraged.", "Failure is treated as a learning opportunity.", "Cross-functional collaboration happens naturally.", "The organisation responds well to external pressures."],
      ];
      let sort = 0;
      const result: any[] = [];
      qs.forEach((catQs, catIdx) => {
        catQs.forEach(text => {
          result.push({ category_index: catIdx, type: "rating_scale", text, help_text: "1 = Strongly Disagree, 5 = Strongly Agree", is_required: true, sort_order: sort++, options: ratingOptions() });
        });
      });
      return result;
    })(),
    score_tiers: [
      { label: "Resistant", min_pct: 0, max_pct: 30, colour: "#EF4444", description: "Significant barriers to change. Build leadership commitment first.", sort_order: 0 },
      { label: "Cautious", min_pct: 31, max_pct: 55, colour: "#F59E0B", description: "Some readiness but key gaps. Invest in communication and capability.", sort_order: 1 },
      { label: "Willing", min_pct: 56, max_pct: 80, colour: "#3B82F6", description: "Good foundation. Strengthen engagement and ensure resources.", sort_order: 2 },
      { label: "Ready", min_pct: 81, max_pct: 100, colour: "#10B981", description: "Excellent readiness. Leadership, culture, and capabilities aligned.", sort_order: 3 },
    ],
  },
};

// ─── EXPORTS ────────────────────────────────────────────────────

export const TEMPLATE_FIXTURES: TemplateFixture[] = [
  digitalMaturity,
  operationalEfficiency,
  leadershipEffectiveness,
  financialHealth,
  mtdReadiness,
  advisoryNeeds,
  clientOnboarding,
  changeReadiness,
];

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  consulting: "Consulting",
  accounting: "Accounting",
  advisory: "Advisory",
  technology: "Technology",
  hr: "HR",
  compliance: "Compliance",
  operations: "Operations",
};
