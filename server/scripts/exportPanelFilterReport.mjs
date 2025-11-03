import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from both the server and repository root if available
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const resolveApiBaseUrl = () => {
  const fallback = 'http://localhost:5000/api';
  const rawBase = (process.env.API_BASE_URL || process.env.VITE_API_URL || fallback).trim();
  const trimmed = rawBase.replace(/\/+$/, '');

  try {
    const url = new URL(trimmed);
    const pathname = url.pathname.replace(/\/+$/, '');
    if (!pathname.startsWith('/api')) {
      const nextPath = `${pathname || ''}/api`.replace(/\/+/g, '/');
      // ensure leading slash
      url.pathname = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
    }
    return url.toString().replace(/\/+$/, '');
  } catch (error) {
    const normalized = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
    return normalized.replace(/\/+$/, '');
  }
};

const API_BASE_URL = resolveApiBaseUrl();
const ADMIN_JWT = process.env.ADMIN_JWT;

if (!ADMIN_JWT) {
  throw new Error('Missing ADMIN_JWT environment variable. Please set a valid admin JWT token.');
}

const OUTPUT_PATH = path.resolve(process.cwd(), process.env.PANEL_FILTER_OUTPUT || 'panel-filter-report.txt');

const MARK_FILTERS = [
  { key: 'any', label: 'No mark-status filter (all panels)', predicate: () => true },
  { key: 'all', label: 'Fully marked panels', predicate: (summary) => summary?.status === 'all' },
  { key: 'partial', label: 'Partially marked panels', predicate: (summary) => summary?.status === 'partial' },
  { key: 'none', label: 'Panels with no marks recorded', predicate: (summary) => summary?.status === 'none' },
  { key: 'no-projects', label: 'Panels without assigned projects', predicate: (summary) => summary?.status === 'no-projects' },
];

const normalizeReviewCollection = (reviews) => {
  if (!reviews) return {};
  if (reviews instanceof Map) {
    return Object.fromEntries(reviews);
  }
  if (typeof reviews === 'object') {
    return { ...reviews };
  }
  return {};
};

const normalizeMarksCollection = (marks) => {
  if (!marks) return {};
  if (marks instanceof Map) {
    return Object.fromEntries(marks);
  }
  if (typeof marks === 'object') {
    return { ...marks };
  }
  return {};
};

const reviewHasPositiveMarks = (review) => {
  if (!review || typeof review !== 'object') return false;

  const marks = normalizeMarksCollection(review.marks);
  for (const value of Object.values(marks)) {
    if (typeof value === 'number' && !Number.isNaN(value) && value > 0) {
      return true;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) continue;
      const numeric = Number(trimmed);
      if (!Number.isNaN(numeric) && numeric > 0) {
        return true;
      }
    }
  }

  return false;
};

const resolveSchoolDepartment = (project, panel) => {
  const rawSchool = project?.school ?? panel?.school;
  const rawDepartment = project?.department ?? panel?.department;

  const school = Array.isArray(rawSchool) ? rawSchool[0] : rawSchool;
  const department = Array.isArray(rawDepartment) ? rawDepartment[0] : rawDepartment;

  if (!school || !department) {
    return [null, null];
  }
  return [school, department];
};

const schemaKeyFor = (school, department) => {
  if (!school || !department) return null;
  return `${school}|||${department}`;
};

const computeProjectMarkInfo = (project, panel, schemaCache, selectedReview) => {
  const baseSummary = {
    reviewNames: [],
    totalStudents: Array.isArray(project?.students) ? project.students.length : 0,
    studentsWithMarks: 0,
    studentsFullyMarked: 0,
    hasAnyMarked: false,
    isFullyMarked: false,
    projectMarked: false,
    projectFullyMarked: false,
    status: 'none',
  };

  if (!project || !Array.isArray(project.students) || project.students.length === 0) {
    return baseSummary;
  }

  const [school, department] = resolveSchoolDepartment(project, panel);
  const key = schemaKeyFor(school, department);
  const schema = key ? schemaCache.get(key) : null;
  const panelReviews = (schema?.reviews || []).filter((review) => review.facultyType === 'panel');

  if (!schema || panelReviews.length === 0) {
    return { ...baseSummary, status: 'no-schema' };
  }

  const applicableReviews = selectedReview && selectedReview !== 'all'
    ? panelReviews.filter((review) => review.reviewName === selectedReview)
    : panelReviews;

  if (applicableReviews.length === 0) {
    return {
      ...baseSummary,
      reviewNames: panelReviews.map((review) => review.reviewName),
      status: 'no-review',
    };
  }

  const reviewNames = applicableReviews.map((review) => review.reviewName);
  let studentsWithMarks = 0;
  let studentsFullyMarked = 0;

  project.students.forEach((student) => {
    const reviews = normalizeReviewCollection(student.reviews);

    const hasPositiveMarks = reviewNames.some((reviewName) => reviewHasPositiveMarks(reviews[reviewName]));
    const hasMarksForAll = reviewNames.every((reviewName) => reviewHasPositiveMarks(reviews[reviewName]));

    if (hasPositiveMarks) studentsWithMarks += 1;
    if (hasMarksForAll) studentsFullyMarked += 1;
  });

  const totalStudents = project.students.length;
  const projectFullyMarked = totalStudents > 0 && studentsFullyMarked === totalStudents;
  const projectMarked = studentsWithMarks > 0;
  const status = projectFullyMarked ? 'full' : projectMarked ? 'partial' : 'none';

  return {
    reviewNames,
    totalStudents,
    studentsWithMarks,
    studentsFullyMarked,
    hasAnyMarked: projectMarked,
    isFullyMarked: projectFullyMarked,
    projectMarked,
    projectFullyMarked,
    status,
  };
};

const computePanelMarkSummary = (panel, schemaCache, selectedReview) => {
  const enrichedTeams = (panel.teams || []).map((team) => {
    const markStatus = computeProjectMarkInfo(team.full, panel, schemaCache, selectedReview);
    return {
      ...team,
      markStatus,
    };
  });

  const totalProjects = enrichedTeams.length;
  const fullyMarkedProjects = enrichedTeams.filter((team) => team.markStatus.projectFullyMarked).length;
  const projectsWithMarks = enrichedTeams.filter((team) => team.markStatus.projectMarked).length;
  const partialProjects = Math.max(projectsWithMarks - fullyMarkedProjects, 0);
  const unmarkedProjects = Math.max(totalProjects - projectsWithMarks, 0);

  let status = 'none';
  if (totalProjects === 0) {
    status = 'no-projects';
  } else if (fullyMarkedProjects === totalProjects && totalProjects > 0) {
    status = 'all';
  } else if (projectsWithMarks === 0) {
    status = 'none';
  } else {
    status = 'partial';
  }

  return {
    teams: enrichedTeams,
    summary: {
      totalProjects,
      fullyMarkedProjects,
      partialProjects,
      unmarkedProjects,
      markedProjects: projectsWithMarks,
      status,
    },
  };
};

const buildUrl = (pathSegment, params = {}) => {
  const normalizedPath = pathSegment.startsWith('/') ? pathSegment : `/${pathSegment}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.append(key, value);
  });
  return url;
};

const apiRequest = async (pathSegment, { method = 'GET', params, body } = {}) => {
  const url = buildUrl(pathSegment, params);
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${ADMIN_JWT}`,
  };

  const init = { method, headers };

  if (body) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);
  const rawText = await response.text();
  let parsedBody = null;

  if (rawText) {
    try {
      parsedBody = JSON.parse(rawText);
    } catch (parseError) {
      parsedBody = rawText;
    }
  }

  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}: ${response.statusText}`);
    error.status = response.status;
    error.responseBody = parsedBody;
    throw error;
  }

  return parsedBody;
};

const extractArray = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.projects)) return payload.projects;
  return [];
};

const globalSchemaCache = new Map();

const loadSchema = async (school, department) => {
  const key = schemaKeyFor(school, department);
  if (!key) return null;
  if (globalSchemaCache.has(key)) {
    return globalSchemaCache.get(key);
  }

  try {
    const response = await apiRequest('/student/marking-schema', {
      params: { school, department },
    });
    const schema = response?.schema || response?.data?.schema || null;
    globalSchemaCache.set(key, schema);
    return schema;
  } catch (error) {
    if (error.status === 404) {
      globalSchemaCache.set(key, null);
      return null;
    }
    throw error;
  }
};

const gatherSchemasForPanels = async (panels) => {
  const keys = new Set();
  panels.forEach((panel) => {
    (panel.teams || []).forEach((team) => {
      const [school, department] = resolveSchoolDepartment(team.full, panel);
      const key = schemaKeyFor(school, department);
      if (key) keys.add(key);
    });
  });

  const schemaEntries = await Promise.all(
    Array.from(keys).map(async (key) => {
      const [schemaSchool, schemaDepartment] = key.split('|||');
      const schema = await loadSchema(schemaSchool, schemaDepartment);
      return [key, schema];
    }),
  );

  return new Map(schemaEntries);
};

const buildPanelReviewOptions = (schemaCache) => {
  const optionMap = new Map();
  schemaCache.forEach((schema) => {
    (schema?.reviews || [])
      .filter((review) => review.facultyType === 'panel')
      .forEach((review) => {
        if (!review.reviewName) return;
        if (!optionMap.has(review.reviewName)) {
          optionMap.set(review.reviewName, {
            value: review.reviewName,
            label: review.displayName || review.reviewName,
          });
        }
      });
  });

  return Array.from(optionMap.values()).sort((a, b) => a.label.localeCompare(b.label));
};

const mapPanels = (panelsRaw, panelProjectsRaw, projectsRaw) => {
  const panelsArray = extractArray(panelsRaw);
  const panelProjectsArray = extractArray(panelProjectsRaw);
  const projectArray = extractArray(projectsRaw);

  const detailedProjectMap = new Map(
    projectArray.map((project) => {
      const id = project?._id?.toString?.() || String(project?._id || '');
      return [id, project];
    }),
  );

  const panelTeamsMap = new Map();
  panelProjectsArray.forEach((panelEntry) => {
    const teams = (panelEntry.projects || []).map((project) => {
      const projectId = project?._id?.toString?.() || String(project?._id || '');
      const detailedProject = detailedProjectMap.get(projectId) || project;
      return {
        id: projectId,
        name: project.name,
        domain: project.domain || project.specialization || 'N/A',
        members: (project.students || []).map((student) => student.name || student.regNo),
        full: detailedProject,
      };
    });
    const panelId = panelEntry.panelId?.toString?.() || String(panelEntry.panelId || '');
    panelTeamsMap.set(panelId, teams);
  });

  return panelsArray.map((panel) => {
    const panelId = panel?._id?.toString?.() || String(panel?._id || '');
    const members = Array.isArray(panel.members) ? panel.members : [];
    return {
      panelId,
      facultyIds: members.map((member) => member?._id?.toString?.()).filter(Boolean),
      facultyNames: members.map((member) => member?.name).filter(Boolean),
      facultyEmployeeIds: members.map((member) => member?.employeeId?.toString?.()).filter(Boolean),
      venue: panel.venue || null,
      department: panel.department || 'Unknown',
      school: panel.school || 'Unknown',
      teams: panelTeamsMap.get(panelId) || [],
    };
  });
};

const fetchContextPanels = async ({ school, department }) => {
  const params = {};
  if (school) params.school = school;
  if (department) params.department = department;

  const [panelsResponse, panelProjectsResponse, projectsResponse] = await Promise.all([
    apiRequest('/admin/getAllPanels', { params }),
    apiRequest('/admin/getAllPanelProjects', { params }),
    apiRequest('/project/all', { params }),
  ]);

  return mapPanels(panelsResponse, panelProjectsResponse, projectsResponse);
};

const fetchContexts = async () => {
  const panelsResponse = await apiRequest('/admin/getAllPanels');
  const panelsArray = extractArray(panelsResponse);

  const contextSet = new Set();

  panelsArray.forEach((panel) => {
    const schools = Array.isArray(panel.school) ? panel.school : [panel.school];
    const departments = Array.isArray(panel.department) ? panel.department : [panel.department];

    schools.filter(Boolean).forEach((school) => {
      departments.filter(Boolean).forEach((department) => {
        contextSet.add(`${school}|||${department}`);
      });
    });
  });

  return Array.from(contextSet)
    .map((entry) => {
      const [school, department] = entry.split('|||');
      return { school, department };
    })
    .sort((a, b) => {
      const schoolCompare = a.school.localeCompare(b.school);
      if (schoolCompare !== 0) return schoolCompare;
      return a.department.localeCompare(b.department);
    });
};

const formatPanelLine = (panel, idx) => {
  const facultyPairs = (panel.facultyNames || []).map((name, i) => {
    const empId = panel.facultyEmployeeIds?.[i];
    return empId ? `${name} (#${empId})` : name;
  });
  const facultyText = facultyPairs.length ? facultyPairs.join(', ') : 'No faculty recorded';
  const status = panel.markSummary?.status || 'unknown';
  const totalProjects = panel.markSummary?.totalProjects ?? 0;
  const markedProjects = panel.markSummary?.markedProjects ?? 0;
  return `  ${idx + 1}. Panel ${panel.panelId || 'N/A'} | status=${status} | projects=${markedProjects}/${totalProjects}\n     Faculty: ${facultyText}`;
};

const run = async () => {
  const reportLines = [];
  const generatedAt = new Date().toISOString();
  reportLines.push('Panel Management Filter Export');
  reportLines.push(`Generated at: ${generatedAt}`);
  reportLines.push(`API base: ${API_BASE_URL}`);
  reportLines.push('');

  const contexts = await fetchContexts();
  if (contexts.length === 0) {
    reportLines.push('No panels found for any school/department.');
    await writeFile(OUTPUT_PATH, reportLines.join('\n'), 'utf8');
    console.log(`Report generated at ${OUTPUT_PATH}`);
    return;
  }

  for (const context of contexts) {
    reportLines.push('============================================================');
    reportLines.push(`School: ${context.school}`);
    reportLines.push(`Department: ${context.department}`);

    const panels = await fetchContextPanels(context);
    reportLines.push(`Panels fetched: ${panels.length}`);

    if (panels.length === 0) {
      reportLines.push('No panels for this context.');
      reportLines.push('');
      continue;
    }

    const schemaCache = await gatherSchemasForPanels(panels);
    const reviewOptions = buildPanelReviewOptions(schemaCache);
    const reviewSelections = ['all', ...reviewOptions.map((opt) => opt.value)];

    const reviewLabelMap = new Map(reviewOptions.map((opt) => [opt.value, opt.label]));

    reportLines.push(`Review filters discovered: ${reviewSelections.length}`);
    reportLines.push('');

    for (const reviewSelection of reviewSelections) {
      const selectionLabel = reviewSelection === 'all'
        ? 'All panel reviews'
        : reviewLabelMap.get(reviewSelection) || reviewSelection;

      const panelsWithSummary = panels.map((panel) => {
        const { teams, summary } = computePanelMarkSummary(panel, schemaCache, reviewSelection);
        return {
          ...panel,
          teams,
          markSummary: summary,
        };
      });

      reportLines.push(`Review Selection: ${selectionLabel}`);

      for (const markFilter of MARK_FILTERS) {
        const filteredPanels = panelsWithSummary.filter((panel) => markFilter.predicate(panel.markSummary));
        const uniqueFaculty = new Set();
        filteredPanels.forEach((panel) => {
          (panel.facultyNames || []).forEach((name, idx) => {
            const empId = panel.facultyEmployeeIds?.[idx];
            uniqueFaculty.add(empId ? `${name} (#${empId})` : name);
          });
        });

        reportLines.push(`  Mark Filter: ${markFilter.label}`);
        reportLines.push(`    Matched Panels: ${filteredPanels.length}`);
        reportLines.push(`    Unique Faculty Count: ${uniqueFaculty.size}`);
        reportLines.push(`    Faculty List: ${uniqueFaculty.size ? Array.from(uniqueFaculty).join('; ') : 'None'}`);

        if (filteredPanels.length > 0) {
          reportLines.push('    Panels:');
          filteredPanels.forEach((panel, idx) => {
            reportLines.push(formatPanelLine(panel, idx));
          });
        }
      }

      reportLines.push('');
    }
  }

  await writeFile(OUTPUT_PATH, reportLines.join('\n'), 'utf8');
  console.log(`Report generated at ${OUTPUT_PATH}`);
};

run().catch((error) => {
  console.error('Failed to generate panel filter report:', error);
  process.exitCode = 1;
});
