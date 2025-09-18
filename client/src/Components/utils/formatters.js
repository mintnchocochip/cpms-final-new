export const normalizeSpecialization = (spec) => {
  if (!spec) return '';
  
  const displayMap = {
    'AI/ML': 'ai/ml',
    'Data Science': 'data science',
    'Cyber Security': 'cyber security',
    'IoT': 'iot',
    'Blockchain': 'blockchain',
    'Cloud Computing': 'cloud computing',
    'VLSI': 'vlsi',
    'Software Engineering': 'software engineering',
    'General': 'general',
    'Web Development': 'web development',
    'Mobile Development': 'mobile development',
    'DevOps': 'devops',
    'Database Management': 'database management'
  };
  
  return displayMap[spec] || spec.toLowerCase().trim();
};

export const normalizeType = (typ) => {
  if (!typ) return '';
  
  const displayMap = {
    'Software': 'software',
    'Hardware': 'hardware'
  };
  
  return displayMap[typ] || typ.toLowerCase().trim();
};

export const displaySpecialization = (spec) => {
  if (!spec) return '';
  
  const backendMap = {
    'ai/ml': 'AI/ML',
    'data science': 'Data Science',
    'cyber security': 'Cyber Security',
    'iot': 'IoT',
    'blockchain': 'Blockchain',
    'cloud computing': 'Cloud Computing',
    'vlsi': 'VLSI',
    'software engineering': 'Software Engineering',
    'general': 'General',
    'web development': 'Web Development',
    'mobile development': 'Mobile Development',
    'devops': 'DevOps',
    'database management': 'Database Management'
  };
  
  return backendMap[spec.toLowerCase()] || spec;
};

export const displayType = (typ) => {
  if (!typ) return '';
  
  const backendMap = {
    'software': 'Software',
    'hardware': 'Hardware'
  };
  
  return backendMap[typ.toLowerCase()] || typ;
};
