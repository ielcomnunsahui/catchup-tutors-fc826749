/** Shared catalogue of examinations and subjects used across Programs, Resources and Premium. */

export type ExamScope = "international" | "local";

export type Exam = {
  id: string;
  name: string;
  scope: ExamScope;
  blurb: string;
};

export const EXAMS: Exam[] = [
  { id: "cambridge", name: "Cambridge", scope: "international", blurb: "IGCSE, AS and A-Level pathways." },
  { id: "edexcel", name: "Edexcel", scope: "international", blurb: "Pearson International GCSE and A-Level." },
  { id: "ib", name: "IB", scope: "international", blurb: "Diploma Programme SL and HL." },
  { id: "igcse", name: "IGCSE", scope: "international", blurb: "International GCSE foundation years." },
  { id: "tmua", name: "TMUA", scope: "international", blurb: "Test of Mathematics for University Admission." },
  { id: "gre", name: "GRE", scope: "international", blurb: "Graduate admissions quant and verbal." },
  { id: "toefl", name: "TOEFL", scope: "international", blurb: "English proficiency for US-bound students." },
  { id: "ielts", name: "IELTS", scope: "international", blurb: "Academic and general English proficiency." },
  { id: "sat", name: "SAT", scope: "international", blurb: "Digital SAT maths and reading & writing." },
  { id: "gmat", name: "GMAT", scope: "international", blurb: "Business school admissions preparation." },
  { id: "jamb", name: "JAMB", scope: "local", blurb: "UTME preparation across four subjects." },
  { id: "waec", name: "WAEC", scope: "local", blurb: "West African Senior School Certificate." },
  { id: "neco", name: "NECO", scope: "local", blurb: "National Examinations Council SSCE." },
  { id: "jupeb", name: "JUPEB", scope: "local", blurb: "Joint Universities Preliminary Examinations Board." },
  { id: "ijmb", name: "IJMB", scope: "local", blurb: "Interim Joint Matriculation Board A-Level equivalent." },
];

export const examsByScope = (scope: ExamScope) => EXAMS.filter((e) => e.scope === scope);

export type CatalogSubject = {
  id: string;
  name: string;
  topics: string[];
};

export const CATALOG_SUBJECTS: CatalogSubject[] = [
  {
    id: "mathematics",
    name: "Mathematics",
    topics: ["Number & Surds", "Algebra & Quadratics", "Functions & Graphs", "Coordinate Geometry", "Trigonometry", "Sequences & Series", "Differentiation", "Integration", "Vectors", "Probability & Statistics"],
  },
  {
    id: "further-mathematics",
    name: "Further Mathematics",
    topics: ["Roots of Polynomials", "Matrices & Linear Spaces", "Complex Numbers", "Hyperbolic Functions", "Polar Coordinates", "Proof by Induction", "Differential Equations", "Further Mechanics", "Further Statistics"],
  },
  {
    id: "physics",
    name: "Physics",
    topics: ["Measurement & Units", "Kinematics", "Forces & Dynamics", "Work, Energy & Power", "Waves & Sound", "Light & Optics", "Electricity & Circuits", "Magnetic Fields", "Thermal Physics", "Nuclear & Modern Physics"],
  },
  {
    id: "chemistry",
    name: "Chemistry",
    topics: ["Atomic Structure", "Chemical Bonding", "Stoichiometry", "States of Matter", "Energetics", "Reaction Kinetics", "Chemical Equilibria", "Redox & Electrochemistry", "Organic Chemistry", "Analytical Techniques"],
  },
  {
    id: "biology",
    name: "Biology",
    topics: ["Cell Structure", "Biological Molecules", "Enzymes", "Transport in Plants & Animals", "Gas Exchange", "Genetics & Inheritance", "Evolution & Classification", "Ecology", "Homeostasis & Coordination", "Biotechnology"],
  },
  {
    id: "computer-science",
    name: "Computer Science",
    topics: ["Data Representation", "Computer Architecture", "Networks & Internet", "Databases", "Algorithms", "Programming Fundamentals", "Object-Oriented Programming", "Software Development Life Cycle", "Security & Ethics"],
  },
  {
    id: "sociology",
    name: "Sociology",
    topics: ["Sociological Theory", "Research Methods", "Culture & Identity", "Family & Households", "Education", "Social Stratification", "Crime & Deviance", "Media & Society", "Globalisation"],
  },
  {
    id: "law",
    name: "Law",
    topics: ["Legal Systems & Sources", "Constitutional Law", "Criminal Law", "Law of Torts", "Contract Law", "Human Rights", "Legal Reasoning", "Case Analysis Skills"],
  },
  {
    id: "psychology",
    name: "Psychology",
    topics: ["Approaches in Psychology", "Research Methods", "Biopsychology", "Memory", "Attachment", "Social Influence", "Psychopathology", "Cognitive Development", "Issues & Debates"],
  },
  {
    id: "english",
    name: "English",
    topics: ["Reading Comprehension", "Summary Writing", "Grammar & Usage", "Vocabulary Development", "Essay & Directed Writing", "Literary Analysis", "Oral & Listening Skills", "Exam Technique"],
  },
  {
    id: "accounting",
    name: "Accounting",
    topics: ["Double Entry Bookkeeping", "Trial Balance", "Financial Statements", "Depreciation & Provisions", "Control Accounts", "Partnership Accounts", "Company Accounts", "Cost & Management Accounting", "Ratio Analysis"],
  },
  {
    id: "economics",
    name: "Economics",
    topics: ["Basic Economic Problem", "Demand & Supply", "Elasticity", "Market Structures", "Market Failure", "National Income", "Money & Banking", "Inflation & Unemployment", "International Trade", "Development Economics"],
  },
  {
    id: "business",
    name: "Business",
    topics: ["Business Environment", "Forms of Business Ownership", "Marketing", "Human Resource Management", "Operations Management", "Business Finance", "Entrepreneurship", "Business Strategy"],
  },
];

export const subjectById = (id: string) => CATALOG_SUBJECTS.find((s) => s.id === id);
