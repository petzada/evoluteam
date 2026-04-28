import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker/locale/pt_BR';
import type {
  Database,
  PipelineSnapshotStage,
  Tables,
  TablesInsert,
} from '../src/lib/supabase/types';
import {
  COMPETENCIES,
  DEMO_COMPANY,
  DEPARTMENT_PLANS,
  DEPARTMENTS,
  POSITIONS,
  type DepartmentName,
} from './mock-demo/data/org-structure';
import { buildFeedbackMessage, type FeedbackType } from './mock-demo/data/feedback-templates';
import { PDI_TEMPLATES } from './mock-demo/data/pdi-templates';
import { JOB_TEMPLATES } from './mock-demo/data/job-templates';

type PublicTable = keyof Database['public']['Tables'];
type SupabaseAdmin = SupabaseClient<Database>;

type DemoLoginKey = 'admin' | 'gestor' | 'colab';

type DemoAuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: 'admin_rh' | 'director' | 'user';
};

type EmployeeWithMeta = Tables<'employees'> & {
  departmentName: DepartmentName;
  positionName: string;
  isManager: boolean;
  demoKey?: DemoLoginKey;
};

type ReviewQuestionRow = Tables<'review_questions'>;
type RecruitmentStageRow = Tables<'recruitment_stages'>;

type WeightedItem<T> = [T, number];

const DEMO_PASSWORD = 'Demo@2026';
const EMAIL_DOMAIN = 'vertice-demo.local';
const ANCHOR_DATE = new Date('2026-04-27T12:00:00-03:00');

let createdCompanyId: string | null = null;

function loadEnvLocal() {
  try {
    const content = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (!process.env[key]) {
        process.env[key] = rawValue.trim().replace(/^['"]|['"]$/g, '');
      }
    }
  } catch {
    // The explicit env validation below prints the actionable message.
  }
}

function parseArgs() {
  const suffixArg = process.argv.find((arg) => arg.startsWith('--suffix='));
  const seedArg = process.argv.find((arg) => arg.startsWith('--seed='));
  const suffixRaw = suffixArg?.split('=').slice(1).join('=').trim() ?? '';
  const seedRaw = seedArg?.split('=').slice(1).join('=').trim();

  if (suffixArg && !suffixRaw) {
    throw new Error('Flag --suffix recebida sem valor. Exemplo: --suffix=v2');
  }

  const suffix = suffixRaw
    ? suffixRaw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
    : null;

  if (suffixArg && !suffix) {
    throw new Error('O valor de --suffix precisa ter ao menos uma letra ou número.');
  }

  const seed = seedRaw ? Number(seedRaw) : null;
  if (seedRaw && (!Number.isInteger(seed) || seed === null)) {
    throw new Error('Flag --seed precisa ser um número inteiro. Exemplo: --seed=42');
  }

  return { suffix, seed };
}

function makeDemoEmail(localPart: string, suffix: string | null) {
  return suffix
    ? `${localPart}+${suffix}@${EMAIL_DOMAIN}`
    : `${localPart}@${EMAIL_DOMAIN}`;
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.+/g, '.');
}

function employeeEmail(fullName: string, index: number) {
  const slug = slugify(fullName) || `colaborador.${index}`;
  return `${slug}.${String(index).padStart(2, '0')}@${EMAIL_DOMAIN}`;
}

function step(message: string) {
  console.log(`→ ${message}`);
}

function iso(date: Date) {
  return date.toISOString();
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function randInt(min: number, max: number) {
  return faker.number.int({ min, max });
}

function randDateBetween(from: Date, to: Date) {
  return faker.date.between({ from, to });
}

function pickRandom<T>(items: T[]): T {
  if (items.length === 0) throw new Error('pickRandom recebeu uma lista vazia.');
  return items[randInt(0, items.length - 1)];
}

function pickN<T>(items: T[], count: number): T[] {
  if (count > items.length) {
    throw new Error(`pickN pediu ${count} itens, mas só há ${items.length}.`);
  }
  return faker.helpers.shuffle([...items]).slice(0, count);
}

function weightedPick<T>(items: WeightedItem<T>[]): T {
  const total = items.reduce((sum, [, weight]) => sum + weight, 0);
  let cursor = faker.number.float({ min: 0, max: total, fractionDigits: 8 });
  for (const [item, weight] of items) {
    cursor -= weight;
    if (cursor <= 0) return item;
  }
  return items[items.length - 1][0];
}

function supabaseErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') return String(error);
  const parts: string[] = [];
  for (const key of ['message', 'details', 'hint', 'code']) {
    const value = (error as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.trim()) parts.push(`${key}: ${value}`);
  }
  return parts.length ? parts.join(' | ') : JSON.stringify(error);
}

async function insertRows<Table extends PublicTable>(
  supabase: SupabaseAdmin,
  table: Table,
  rows: TablesInsert<Table>[],
  label: string,
): Promise<Tables<Table>[]> {
  if (rows.length === 0) return [];
  const { data, error } = await supabase
    .from(table)
    .insert(rows as never)
    .select();
  if (error) {
    throw new Error(`Falha ao inserir ${label} em ${String(table)}: ${supabaseErrorMessage(error)}`);
  }
  return (data ?? []) as Tables<Table>[];
}

async function insertOne<Table extends PublicTable>(
  supabase: SupabaseAdmin,
  table: Table,
  row: TablesInsert<Table>,
  label: string,
): Promise<Tables<Table>> {
  const rows = await insertRows(supabase, table, [row], label);
  const inserted = rows[0];
  if (!inserted) throw new Error(`Insert sem retorno para ${label} em ${String(table)}.`);
  return inserted;
}

async function assertDemoEmailsAvailable(supabase: SupabaseAdmin, emails: string[]) {
  const wanted = new Set(emails.map((email) => email.toLowerCase()));
  const found = new Set<string>();
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`Não foi possível checar auth.users: ${supabaseErrorMessage(error)}`);
    }
    for (const user of data.users) {
      const email = user.email?.toLowerCase();
      if (email && wanted.has(email)) found.add(email);
    }
    if (data.users.length < perPage || found.size === wanted.size) break;
    page += 1;
  }

  if (found.size > 0) {
    const duplicates = Array.from(found).sort().join(', ');
    throw new Error(
      `Já existem auth.users para estes emails: ${duplicates}.\n` +
      'Apague esses usuários no Supabase Studio antes de rodar novamente ou use uma flag como --suffix=v2.',
    );
  }
}

async function createDemoAuthUsers(
  supabase: SupabaseAdmin,
  suffix: string | null,
): Promise<Record<DemoLoginKey, DemoAuthUser>> {
  const specs: Record<DemoLoginKey, Omit<DemoAuthUser, 'id'>> = {
    admin: {
      email: makeDemoEmail('admin', suffix),
      fullName: 'Marina Almeida',
      role: 'admin_rh',
    },
    gestor: {
      email: makeDemoEmail('gestor', suffix),
      fullName: 'Ricardo Nogueira',
      role: 'director',
    },
    colab: {
      email: makeDemoEmail('colab', suffix),
      fullName: 'Camila Rocha',
      role: 'user',
    },
  };

  await assertDemoEmailsAvailable(
    supabase,
    Object.values(specs).map((spec) => spec.email),
  );

  const result = {} as Record<DemoLoginKey, DemoAuthUser>;
  for (const key of Object.keys(specs) as DemoLoginKey[]) {
    const spec = specs[key];
    const { data, error } = await supabase.auth.admin.createUser({
      email: spec.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: spec.fullName },
    });
    if (error || !data.user) {
      throw new Error(`Falha ao criar auth.user ${spec.email}: ${supabaseErrorMessage(error)}`);
    }
    result[key] = { ...spec, id: data.user.id };
  }
  return result;
}

function buildEmployeeRows(
  companyId: string,
  authUsers: Record<DemoLoginKey, DemoAuthUser>,
  departmentIds: Map<string, string>,
  positionIds: Map<string, string>,
) {
  const managerRows: TablesInsert<'employees'>[] = [];
  const baseHireDate = new Date('2022-01-10T12:00:00-03:00');

  for (const plan of DEPARTMENT_PLANS) {
    const isCommercial = plan.name === 'Comercial';
    let fullName: string;
    if (isCommercial) {
      fullName = authUsers.gestor.fullName;
    } else if (plan.name === 'Jurídico') {
      fullName = 'Helena Duarte';
    } else if (plan.name === 'Análise de Crédito') {
      fullName = 'Patrícia Azevedo';
    } else if (plan.name === 'Operações & Backoffice') {
      fullName = 'Bruno Martins';
    } else if (plan.name === 'Atendimento ao Cliente') {
      fullName = 'Tatiane Lopes';
    } else {
      fullName = 'Fernanda Mello';
    }
    const email = isCommercial ? authUsers.gestor.email : employeeEmail(fullName, managerRows.length + 1);
    const demoKey = isCommercial ? 'gestor' : undefined;
    managerRows.push({
      company_id: companyId,
      user_id: demoKey ? authUsers[demoKey].id : null,
      full_name: fullName,
      email,
      phone: faker.phone.number({ style: 'national' }),
      position_id: positionIds.get(plan.managerPosition) ?? null,
      department_id: departmentIds.get(plan.name) ?? null,
      manager_id: null,
      hire_date: isoDate(addDays(baseHireDate, randInt(0, 900))),
      status: 'active',
      internal_notes: demoKey ? 'Conta demo logável.' : 'Gestor departamental demo sem acesso de login.',
    });
  }

  return { managerRows };
}

function buildStaffRows(
  companyId: string,
  authUsers: Record<DemoLoginKey, DemoAuthUser>,
  departmentIds: Map<string, string>,
  positionIds: Map<string, string>,
  insertedManagers: EmployeeWithMeta[],
) {
  const rows: TablesInsert<'employees'>[] = [];
  let counter = insertedManagers.length + 1;

  const managerByDepartment = new Map(
    insertedManagers.map((manager) => [manager.departmentName, manager]),
  );

  for (const plan of DEPARTMENT_PLANS) {
    const manager = managerByDepartment.get(plan.name);
    if (!manager) throw new Error(`Gestor não encontrado para ${plan.name}.`);
    const staffCount = plan.totalEmployees - 1;
    for (let index = 0; index < staffCount; index += 1) {
      const isAdminDemo = plan.name === 'Administrativo & RH' && index === 0;
      const isColabDemo = plan.name === 'Comercial' && index === 0;
      const demoKey: DemoLoginKey | undefined = isAdminDemo
        ? 'admin'
        : isColabDemo
          ? 'colab'
          : undefined;
      const fullName = demoKey ? authUsers[demoKey].fullName : faker.person.fullName();
      const positionName = isAdminDemo
        ? 'Analista de RH'
        : isColabDemo
          ? 'Consultor Comercial Pleno'
          : plan.staffPositions[index % plan.staffPositions.length];
      rows.push({
        company_id: companyId,
        user_id: demoKey ? authUsers[demoKey].id : null,
        full_name: fullName,
        email: demoKey ? authUsers[demoKey].email : employeeEmail(fullName, counter),
        phone: faker.phone.number({ style: 'national' }),
        position_id: positionIds.get(positionName) ?? null,
        department_id: departmentIds.get(plan.name) ?? null,
        manager_id: manager.id,
        hire_date: isoDate(randDateBetween(new Date('2022-04-01T12:00:00-03:00'), new Date('2026-03-15T12:00:00-03:00'))),
        status: 'active',
        internal_notes: demoKey ? 'Conta demo logável.' : 'Colaborador fantasma demo sem auth.user.',
      });
      counter += 1;
    }
  }

  return rows;
}

function attachEmployeeMeta(
  rows: Tables<'employees'>[],
  departmentNameById: Map<string, DepartmentName>,
  positionNameById: Map<string, string>,
  demoEmails: Record<DemoLoginKey, string>,
): EmployeeWithMeta[] {
  return rows.map((row) => {
    const demoKey = (Object.keys(demoEmails) as DemoLoginKey[])
      .find((key) => demoEmails[key] === row.email);
    return {
      ...row,
      departmentName: departmentNameById.get(row.department_id ?? '') ?? 'Comercial',
      positionName: positionNameById.get(row.position_id ?? '') ?? 'Sem cargo',
      isManager: row.manager_id === null,
      demoKey,
    };
  });
}

function buildReviewQuestionRows(companyId: string, formId: string): TablesInsert<'review_questions'>[] {
  const scaleCompetencies = [
    'Negociação',
    'Comunicação Persuasiva',
    'Conhecimento em Direito Bancário',
    'Análise de Risco de Crédito',
    'Atenção a Detalhes',
    'Foco no Cliente',
  ] as const;

  return [
    ...scaleCompetencies.map((competencyName, index) => ({
      company_id: companyId,
      form_id: formId,
      competency_id: null,
      question_order: index,
      type: 'scale',
      question_text: [
        'Conduz negociações de crédito com preparo, escuta ativa e foco em solução viável.',
        'Comunica alternativas e riscos de forma clara, persuasiva e responsável.',
        'Aplica conhecimentos de direito bancário ao orientar clientes e apoiar decisões.',
        'Analisa riscos de crédito considerando dados, garantias e contexto do cliente.',
        'Demonstra atenção a detalhes em documentos, prazos e registros operacionais.',
        'Mantém foco no cliente sem perder critérios técnicos e regulatórios.',
      ][index],
      is_required: true,
      scale_min: 1,
      scale_max: 5,
      _competencyName: competencyName,
    })),
    {
      company_id: companyId,
      form_id: formId,
      question_order: 6,
      type: 'text',
      question_text: 'Quais foram os principais pontos fortes observados neste ciclo?',
      is_required: true,
    },
    {
      company_id: companyId,
      form_id: formId,
      question_order: 7,
      type: 'text',
      question_text: 'Quais pontos de desenvolvimento devem ser priorizados?',
      is_required: true,
    },
    {
      company_id: companyId,
      form_id: formId,
      question_order: 8,
      type: 'text',
      question_text: 'Cite uma situação concreta que represente o desempenho no período.',
      is_required: true,
    },
    {
      company_id: companyId,
      form_id: formId,
      question_order: 9,
      type: 'text',
      question_text: 'Que apoio da liderança ou da empresa ajudaria no próximo ciclo?',
      is_required: false,
    },
  ].map((row) => {
    const withInternal = row as TablesInsert<'review_questions'> & { _competencyName?: string };
    const { _competencyName, ...cleanRow } = withInternal;
    return cleanRow;
  });
}

function applyCompetencyIdsToQuestions(
  questionRows: TablesInsert<'review_questions'>[],
  competencyIds: Map<string, string>,
) {
  const scaleNames = [
    'Negociação',
    'Comunicação Persuasiva',
    'Conhecimento em Direito Bancário',
    'Análise de Risco de Crédito',
    'Atenção a Detalhes',
    'Foco no Cliente',
  ];
  return questionRows.map((row) => {
    if (row.type !== 'scale') return row;
    const competencyName = scaleNames[row.question_order] ?? null;
    return {
      ...row,
      competency_id: competencyName ? competencyIds.get(competencyName) ?? null : null,
    };
  });
}

function reviewTextAnswer(question: ReviewQuestionRow, assignment: Tables<'review_assignments'>) {
  const self = assignment.type === 'self';
  const options: Record<number, string> = {
    6: self
      ? 'Tenho mantido boa proximidade com clientes e evoluído na organização dos próximos passos após cada conversa.'
      : 'A pessoa demonstrou consistência, boa postura consultiva e cuidado ao lidar com casos sensíveis de crédito.',
    7: self
      ? 'Quero melhorar a priorização quando há muitas demandas simultâneas e registrar decisões com mais contexto.'
      : 'Recomendo fortalecer registro de contexto, antecipação de riscos documentais e gestão de prioridades.',
    8: self
      ? 'Um caso de renegociação exigiu alinhar Comercial, Jurídico e Operações; consegui manter o cliente informado até a proposta final.'
      : 'Em um caso complexo, articulou áreas internas e manteve comunicação clara com o cliente até a solução avançar.',
    9: self
      ? 'Checkpoints quinzenais, acesso a casos de referência e feedbacks rápidos ajudariam no próximo ciclo.'
      : 'Apoio com simulações, acompanhamento de casos críticos e critérios claros de priorização deve acelerar a evolução.',
  };
  return options[question.question_order] ?? 'Sem observação adicional para este item.';
}

function reviewScaleValue() {
  return weightedPick<number>([
    [5, 24],
    [4, 46],
    [3, 24],
    [2, 5],
    [1, 1],
  ]);
}

async function seedReviewCycle(
  supabase: SupabaseAdmin,
  input: {
    companyId: string;
    adminUserId: string;
    cycle: Tables<'review_cycles'>;
    form: Tables<'review_forms'>;
    questions: ReviewQuestionRow[];
    participants: EmployeeWithMeta[];
    mode: 'closed' | 'active';
    colabEmployeeId: string;
    gestorEmployeeId: string;
  },
) {
  const participantRows = input.participants.map<TablesInsert<'review_cycle_participants'>>((employee) => ({
    company_id: input.companyId,
    cycle_id: input.cycle.id,
    employee_id: employee.id,
    added_by: input.adminUserId,
    added_at: iso(randDateBetween(addDays(ANCHOR_DATE, input.mode === 'closed' ? -125 : -20), addDays(ANCHOR_DATE, input.mode === 'closed' ? -110 : -15))),
    result_released_at: input.mode === 'closed' ? input.cycle.closed_at : null,
    result_released_by: input.mode === 'closed' ? input.adminUserId : null,
  }));
  await insertRows(supabase, 'review_cycle_participants', participantRows, `participantes ${input.cycle.name}`);

  const assignmentDrafts: TablesInsert<'review_assignments'>[] = [];
  for (const employee of input.participants) {
    assignmentDrafts.push({
      company_id: input.companyId,
      cycle_id: input.cycle.id,
      form_id: input.form.id,
      reviewee_id: employee.id,
      reviewer_id: employee.id,
      type: 'self',
      status: 'submitted',
      submitted_at: input.mode === 'closed'
        ? iso(randDateBetween(new Date('2026-01-08T12:00:00-03:00'), new Date('2026-01-29T18:00:00-03:00')))
        : iso(randDateBetween(addDays(ANCHOR_DATE, -10), addDays(ANCHOR_DATE, -1))),
    });
    if (employee.manager_id) {
      assignmentDrafts.push({
        company_id: input.companyId,
        cycle_id: input.cycle.id,
        form_id: input.form.id,
        reviewee_id: employee.id,
        reviewer_id: employee.manager_id,
        type: 'manager',
        status: 'submitted',
        submitted_at: input.mode === 'closed'
          ? iso(randDateBetween(new Date('2026-01-10T12:00:00-03:00'), new Date('2026-01-30T18:00:00-03:00')))
          : iso(randDateBetween(addDays(ANCHOR_DATE, -9), addDays(ANCHOR_DATE, -1))),
      });
    }
  }

  if (input.mode === 'active') {
    const targetSubmitted = Math.round(assignmentDrafts.length * 0.7);
    const targetInProgress = Math.round(assignmentDrafts.length * 0.2);
    const targetPending = assignmentDrafts.length - targetSubmitted - targetInProgress;
    const forcedStatuses = new Map<number, 'submitted' | 'in_progress' | 'pending'>();

    const colabSelfIndex = assignmentDrafts.findIndex((assignment) =>
      assignment.reviewee_id === input.colabEmployeeId && assignment.type === 'self'
    );
    if (colabSelfIndex >= 0) {
      forcedStatuses.set(colabSelfIndex, 'pending');
    }

    const gestorAssignmentIndexes = assignmentDrafts
      .map((assignment, index) => ({ assignment, index }))
      .filter(({ assignment }) =>
        assignment.reviewer_id === input.gestorEmployeeId &&
        assignment.type === 'manager' &&
        assignment.reviewee_id !== input.colabEmployeeId
      )
      .slice(0, 5);
    gestorAssignmentIndexes.forEach(({ index }, offset) => {
      forcedStatuses.set(index, offset < 2 ? 'pending' : 'in_progress');
    });

    const forcedCounts = { submitted: 0, in_progress: 0, pending: 0 };
    for (const status of forcedStatuses.values()) forcedCounts[status] += 1;

    const remainingIndexes = assignmentDrafts
      .map((_, index) => index)
      .filter((index) => !forcedStatuses.has(index));
    const statusPool = faker.helpers.shuffle([
      ...Array(Math.max(0, targetSubmitted - forcedCounts.submitted)).fill('submitted'),
      ...Array(Math.max(0, targetInProgress - forcedCounts.in_progress)).fill('in_progress'),
      ...Array(Math.max(0, targetPending - forcedCounts.pending)).fill('pending'),
    ] as Array<'submitted' | 'in_progress' | 'pending'>);
    while (statusPool.length < remainingIndexes.length) statusPool.push('submitted');

    remainingIndexes.forEach((assignmentIndex, poolIndex) => {
      forcedStatuses.set(assignmentIndex, statusPool[poolIndex] ?? 'submitted');
    });

    assignmentDrafts.forEach((assignment, index) => {
      const status = forcedStatuses.get(index) ?? 'submitted';
      assignment.status = status;
      assignment.submitted_at = status === 'submitted'
        ? iso(randDateBetween(addDays(ANCHOR_DATE, -9), addDays(ANCHOR_DATE, -1)))
        : null;
    });
  }

  const assignments = await insertRows(
    supabase,
    'review_assignments',
    assignmentDrafts,
    `assignments ${input.cycle.name}`,
  );

  const answerRows: TablesInsert<'review_answers'>[] = [];
  for (const assignment of assignments) {
    if (assignment.status === 'pending') continue;
    const sortedQuestions = [...input.questions].sort((a, b) => a.question_order - b.question_order);
    const questionsToAnswer = assignment.status === 'submitted'
      ? sortedQuestions
      : sortedQuestions.slice(0, randInt(3, 6));
    for (const question of questionsToAnswer) {
      answerRows.push({
        company_id: input.companyId,
        assignment_id: assignment.id,
        question_id: question.id,
        scale_value: question.type === 'scale' ? reviewScaleValue() : null,
        text_value: question.type === 'text' ? reviewTextAnswer(question, assignment) : null,
        answered_at: assignment.submitted_at ?? iso(randDateBetween(addDays(ANCHOR_DATE, -7), ANCHOR_DATE)),
      });
    }
  }

  await insertRows(supabase, 'review_answers', answerRows, `respostas ${input.cycle.name}`);

  return assignments;
}

function selectParticipants(employees: EmployeeWithMeta[], mode: 'closed' | 'active') {
  const subordinates = employees.filter((employee) => employee.manager_id);
  const colab = employees.find((employee) => employee.demoKey === 'colab');
  const gestor = employees.find((employee) => employee.demoKey === 'gestor');
  if (!colab || !gestor) throw new Error('Contas demo de gestor/colaborador não encontradas em employees.');

  if (mode === 'closed') {
    return pickN(subordinates.filter((employee) => employee.id !== colab.id), 25);
  }

  const commercial = subordinates.filter((employee) => employee.departmentName === 'Comercial');
  const selected = new Map<string, EmployeeWithMeta>();
  selected.set(colab.id, colab);
  for (const employee of pickN(commercial.filter((employee) => employee.id !== colab.id), 9)) {
    selected.set(employee.id, employee);
  }
  const remaining = subordinates.filter((employee) => !selected.has(employee.id));
  for (const employee of pickN(remaining, 30 - selected.size)) {
    selected.set(employee.id, employee);
  }
  return Array.from(selected.values());
}

function feedbackVisibilityFor(type: FeedbackType) {
  if (type === 'observacao_privada') return 'privado';
  // A aba "Empresa" é lida por admin/diretor via RLS apenas quando a visibilidade
  // é RH; manter quase tudo assim deixa a demo populada sem expor observações privadas.
  return weightedPick([
    ['visivel_para_rh', 94],
    ['visivel_para_gestor', 6],
  ] as WeightedItem<'privado' | 'visivel_para_gestor' | 'visivel_para_rh'>[]);
}

function buildFeedbackRows(
  companyId: string,
  employees: EmployeeWithMeta[],
  competencyIds: Map<string, string>,
) {
  const colab = employees.find((employee) => employee.demoKey === 'colab');
  const gestor = employees.find((employee) => employee.demoKey === 'gestor');
  if (!colab || !gestor) throw new Error('Contas demo de feedback não encontradas.');

  const competencies = Array.from(competencyIds.entries()).map(([name, id]) => ({ name, id }));
  const rows: TablesInsert<'feedbacks'>[] = [];

  const pushFeedback = (
    sender: EmployeeWithMeta,
    recipient: EmployeeWithMeta,
    forcedType?: FeedbackType,
  ) => {
    const type = forcedType ?? weightedPick<FeedbackType>([
      ['elogio', 35],
      ['reconhecimento', 25],
      ['ponto_de_melhoria', 20],
      ['orientacao', 15],
      ['observacao_privada', 5],
    ]);
    const competency = faker.datatype.boolean({ probability: 0.3 }) ? pickRandom(competencies) : null;
    rows.push({
      company_id: companyId,
      sender_id: sender.id,
      recipient_id: recipient.id,
      type,
      competency_id: competency?.id ?? null,
      message: buildFeedbackMessage(type, {
        recipientName: recipient.full_name,
        senderName: sender.full_name,
        competencyName: competency?.name ?? null,
      }, rows.length),
      visibility: feedbackVisibilityFor(type),
      read_at: faker.datatype.boolean({ probability: 0.42 })
        ? iso(randDateBetween(addDays(ANCHOR_DATE, -30), ANCHOR_DATE))
        : null,
      created_at: iso(randDateBetween(addDays(ANCHOR_DATE, -183), ANCHOR_DATE)),
    });
  };

  const colabSenders = pickN(
    employees.filter((employee) => employee.id !== colab.id),
    5,
  );
  for (const sender of colabSenders) pushFeedback(sender, colab);

  const gestorRecipients = pickN(
    employees.filter((employee) => employee.id !== gestor.id && employee.id !== colab.id),
    3,
  );
  for (const recipient of gestorRecipients) pushFeedback(gestor, recipient);

  while (rows.length < 150) {
    const sender = pickRandom(employees);
    const recipient = pickRandom(employees.filter((employee) => employee.id !== sender.id));
    pushFeedback(sender, recipient);
  }

  return rows.slice(0, 150);
}

function planStatusDates(status: string, index: number) {
  const createdAt = randDateBetween(addDays(ANCHOR_DATE, -140), addDays(ANCHOR_DATE, -10));
  if (status === 'concluido') {
    return {
      createdAt,
      dueDate: addDays(createdAt, randInt(35, 80)),
      concludedAt: addDays(createdAt, randInt(20, 70)),
      cancelledAt: null,
    };
  }
  if (status === 'cancelado') {
    return {
      createdAt,
      dueDate: addDays(createdAt, randInt(30, 90)),
      concludedAt: null,
      cancelledAt: addDays(createdAt, randInt(10, 40)),
    };
  }
  if (status === 'nao_iniciado') {
    return {
      createdAt: addDays(ANCHOR_DATE, -randInt(2, 12)),
      dueDate: addDays(ANCHOR_DATE, randInt(35, 90)),
      concludedAt: null,
      cancelledAt: null,
    };
  }
  return {
    createdAt,
    dueDate: addDays(ANCHOR_DATE, index % 4 === 0 ? -randInt(3, 18) : randInt(20, 90)),
    concludedAt: null,
    cancelledAt: null,
  };
}

async function seedPdis(
  supabase: SupabaseAdmin,
  input: {
    companyId: string;
    adminUserId: string;
    cycleAId: string;
    employees: EmployeeWithMeta[];
    competencyIds: Map<string, string>;
  },
) {
  const colab = input.employees.find((employee) => employee.demoKey === 'colab');
  const gestor = input.employees.find((employee) => employee.demoKey === 'gestor');
  if (!colab || !gestor) throw new Error('Contas demo de PDI não encontradas.');

  const statuses = [
    'em_andamento',
    ...Array(5).fill('concluido'),
    ...Array(11).fill('em_andamento'),
    ...Array(6).fill('nao_iniciado'),
    ...Array(2).fill('cancelado'),
  ] as Array<'nao_iniciado' | 'em_andamento' | 'concluido' | 'cancelado'>;

  const selectedEmployees = [
    colab,
    ...pickN(input.employees.filter((employee) => employee.id !== colab.id), 24),
  ];

  const planDrafts = statuses.map((status, index) => {
    const employee = selectedEmployees[index];
    const template = PDI_TEMPLATES[index % PDI_TEMPLATES.length];
    const dates = planStatusDates(status, index);
    const id = randomUUID();
    const isColabPlan = employee.id === colab.id;
    return {
      id,
      employee,
      template,
      status,
      dates,
      isColabPlan,
      row: {
        id,
        company_id: input.companyId,
        employee_id: employee.id,
        cycle_id: index < 13 ? input.cycleAId : null,
        competency_id: input.competencyIds.get(template.competencyName) ?? null,
        objective: isColabPlan
          ? 'Evoluir a voz do colaborador em negociações consultivas, com mais autonomia para propor próximos passos e registrar aprendizados.'
          : template.objective,
        due_date: isoDate(dates.dueDate),
        status,
        created_by: input.adminUserId,
        concluded_at: dates.concludedAt ? iso(dates.concludedAt) : null,
        cancelled_at: dates.cancelledAt ? iso(dates.cancelledAt) : null,
        created_at: iso(dates.createdAt),
        updated_at: iso(dates.concludedAt ?? dates.cancelledAt ?? dates.createdAt),
      } satisfies TablesInsert<'development_plans'>,
    };
  });

  await insertRows(
    supabase,
    'development_plans',
    planDrafts.map((plan) => plan.row),
    'PDIs',
  );

  const actionRows: TablesInsert<'development_plan_actions'>[] = [];
  const commentRows: TablesInsert<'development_plan_comments'>[] = [];
  for (const [planIndex, plan] of planDrafts.entries()) {
    const actionCount = plan.isColabPlan ? 4 : randInt(3, 5);
    const titles = plan.isColabPlan
      ? [
        'Preparar roteiro pessoal para reuniões com clientes de alto risco',
        'Conduzir simulação com gestor e registrar feedbacks recebidos',
        'Aplicar checklist de próximos passos em cinco negociações',
        'Apresentar aprendizados em reunião individual de acompanhamento',
      ]
      : faker.helpers.shuffle(plan.template.actions).slice(0, actionCount);
    const colabActionStatuses = ['concluida', 'em_andamento', 'pendente', 'pendente'] as const;
    for (let actionIndex = 0; actionIndex < actionCount; actionIndex += 1) {
      let actionStatus: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
      if (plan.isColabPlan) {
        actionStatus = colabActionStatuses[actionIndex] ?? 'pendente';
      } else if (plan.status === 'concluido') {
        actionStatus = 'concluida';
      } else if (plan.status === 'cancelado') {
        actionStatus = actionIndex === 0 ? 'cancelada' : 'pendente';
      } else if (plan.status === 'nao_iniciado') {
        actionStatus = 'pendente';
      } else {
        actionStatus = weightedPick([
          ['concluida', 35],
          ['em_andamento', 35],
          ['pendente', 30],
        ] as WeightedItem<'pendente' | 'em_andamento' | 'concluida'>[]);
      }
      actionRows.push({
        plan_id: plan.id,
        company_id: input.companyId,
        title: titles[actionIndex % titles.length] ?? 'Acompanhar evolução do plano de desenvolvimento',
        due_date: isoDate(addDays(plan.dates.createdAt, 14 + actionIndex * randInt(12, 25))),
        status: actionStatus,
        responsible_employee_id: plan.isColabPlan && actionIndex === 1 ? gestor.id : plan.employee.id,
        sort_order: actionIndex,
        created_at: iso(addDays(plan.dates.createdAt, actionIndex)),
        updated_at: iso(plan.dates.concludedAt ?? plan.dates.cancelledAt ?? ANCHOR_DATE),
      });
    }

    const shouldComment = plan.isColabPlan || faker.datatype.boolean({ probability: 0.3 });
    if (shouldComment) {
      const count = plan.isColabPlan ? 2 : randInt(1, 3);
      for (let commentIndex = 0; commentIndex < count; commentIndex += 1) {
        commentRows.push({
          plan_id: plan.id,
          company_id: input.companyId,
          author_id: commentIndex % 2 === 0 ? plan.employee.id : gestor.id,
          body: plan.template.comments[commentIndex % plan.template.comments.length],
          created_at: iso(addDays(plan.dates.createdAt, 5 + commentIndex * 9 + planIndex)),
        });
      }
    }
  }

  await insertRows(supabase, 'development_plan_actions', actionRows, 'ações de PDI');
  await insertRows(supabase, 'development_plan_comments', commentRows, 'comentários de PDI');
}

function applicationStatusForStage(stageName: string) {
  return stageName === 'Contratado' ? 'hired' : 'in_progress';
}

function rejectionReason() {
  return weightedPick([
    ['perfil_tecnico_insuficiente', 30],
    ['experiencia_incompativel', 25],
    ['pretensao_salarial_incompativel', 20],
    ['fit_cultural_insuficiente', 15],
    ['comunicacao_insuficiente', 10],
  ] as WeightedItem<TablesInsert<'job_applications'>['rejection_reason']>[]);
}

function withdrawalReason() {
  return weightedPick([
    ['nao_respondeu_contato', 30],
    ['aceitou_outra_proposta', 25],
    ['salario_incompativel', 15],
    ['perdeu_interesse', 20],
    ['processo_muito_longo', 10],
  ] as WeightedItem<TablesInsert<'job_applications'>['withdrawal_reason']>[]);
}

function candidateSource(): Pick<TablesInsert<'candidates'>, 'source' | 'source_other'> {
  const source = weightedPick([
    ['linkedin', 30],
    ['indicacao', 22],
    ['site_empresa', 15],
    ['whatsapp', 12],
    ['gupy', 9],
    ['indeed', 6],
    ['instagram', 4],
    ['outro', 2],
  ] as WeightedItem<TablesInsert<'candidates'>['source']>[]);
  return {
    source,
    source_other: source === 'outro' ? 'Evento jurídico-financeiro' : null,
  };
}

function candidateStageSlots() {
  return [
    ...Array(12).fill('Cadastrado'),
    ...Array(11).fill('Triagem'),
    ...Array(8).fill('Entrevista RH'),
    ...Array(8).fill('Entrevista Gestor'),
    ...Array(6).fill('Teste / Case'),
    ...Array(3).fill('Proposta'),
    ...Array(2).fill('Contratado'),
  ] as string[];
}

async function seedRecruitment(
  supabase: SupabaseAdmin,
  input: {
    companyId: string;
    adminUserId: string;
    adminEmployee: EmployeeWithMeta;
    gestorEmployee: EmployeeWithMeta;
    employees: EmployeeWithMeta[];
    departmentsByName: Map<string, string>;
    positionsByName: Map<string, string>;
    stages: RecruitmentStageRow[];
  },
) {
  const stagesByName = new Map(input.stages.map((stage) => [stage.name, stage]));
  const stagesByPosition = [...input.stages].sort((a, b) => a.position - b.position);
  const pipelineSnapshot: PipelineSnapshotStage[] = stagesByPosition.map((stage) => ({
    id: stage.id,
    name: stage.name,
    position: stage.position,
    kind: stage.kind,
    notifies_hiring_manager: stage.notifies_hiring_manager,
  }));
  const managerByDepartment = new Map(
    input.employees
      .filter((employee) => employee.isManager)
      .map((employee) => [employee.departmentName, employee]),
  );

  const jobRows = JOB_TEMPLATES.map<TablesInsert<'job_openings'>>((template, index) => ({
    id: randomUUID(),
    company_id: input.companyId,
    title: template.title,
    description: template.description,
    department_id: input.departmentsByName.get(template.departmentName) ?? null,
    position_id: input.positionsByName.get(template.positionName) ?? null,
    hiring_manager_id: managerByDepartment.get(template.departmentName)?.id ?? input.gestorEmployee.id,
    employment_type: template.employmentType,
    workplace_type: template.workplaceType,
    location: template.location,
    open_positions: template.openPositions,
    status: 'open',
    pipeline_snapshot: pipelineSnapshot,
    created_by: input.adminUserId,
    created_at: iso(addDays(ANCHOR_DATE, -45 + index * 4)),
    updated_at: iso(addDays(ANCHOR_DATE, -45 + index * 4)),
  }));
  const jobs = await insertRows(supabase, 'job_openings', jobRows, 'vagas');

  const hiredEmployees = pickN(
    input.employees.filter((employee) =>
      !employee.demoKey &&
      employee.manager_id &&
      ['Consultor Comercial Jr', 'Analista de Crédito Jr', 'Atendente de Relacionamento'].includes(employee.positionName)
    ),
    2,
  );

  const slots = candidateStageSlots();
  const terminalEligible = slots
    .map((stageName, index) => ({ stageName, index, stage: stagesByName.get(stageName) }))
    .filter((slot) => slot.stage && slot.stage.position >= 2 && slot.stageName !== 'Contratado');
  const rejectedIndices = new Set(pickN(terminalEligible, 3).map((slot) => slot.index));
  const withdrawnIndices = new Set(
    pickN(terminalEligible.filter((slot) => !rejectedIndices.has(slot.index)), 2)
      .map((slot) => slot.index),
  );
  const hiredSlotIndices = slots
    .map((stageName, index) => ({ stageName, index }))
    .filter((slot) => slot.stageName === 'Contratado')
    .map((slot) => slot.index);

  const candidateDrafts = slots.map((stageName, index) => {
    const id = randomUUID();
    const fullName = faker.person.fullName();
    const source = candidateSource();
    const hiredIndex = hiredSlotIndices.indexOf(index);
    const createdAt = hiredIndex >= 0
      ? addDays(ANCHOR_DATE, -24 + (hiredIndex * 2))
      : randDateBetween(addDays(ANCHOR_DATE, -95), addDays(ANCHOR_DATE, -8));
    return {
      id,
      stageName,
      job: jobs[index % jobs.length],
      createdAt,
      row: {
        id,
        company_id: input.companyId,
        name: fullName,
        email: `${slugify(fullName)}.${String(index + 1).padStart(2, '0')}@candidatos.${EMAIL_DOMAIN}`,
        phone: faker.phone.number({ style: 'national' }),
        linkedin_url: `https://www.linkedin.com/in/${slugify(fullName)}-${index + 1}`,
        resume_url: null,
        source: source.source,
        source_other: source.source_other,
        notes: 'Perfil criado para demonstração do funil de recrutamento da Vértice Crédito.',
        hired_employee_id: hiredIndex >= 0 ? hiredEmployees[hiredIndex].id : null,
        created_by: input.adminUserId,
        created_at: iso(createdAt),
        updated_at: iso(createdAt),
      } satisfies TablesInsert<'candidates'>,
    };
  });

  const candidates = await insertRows(
    supabase,
    'candidates',
    candidateDrafts.map((candidate) => candidate.row),
    'candidatos',
  );
  const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));

  const appDrafts = candidateDrafts.map((candidateDraft, index) => {
    const currentStage = stagesByName.get(candidateDraft.stageName);
    if (!currentStage) throw new Error(`Etapa não encontrada: ${candidateDraft.stageName}.`);
    const id = randomUUID();
    const status = rejectedIndices.has(index)
      ? 'rejected'
      : withdrawnIndices.has(index)
        ? 'withdrawn'
        : applicationStatusForStage(candidateDraft.stageName);
    const reachedAt = addDays(candidateDraft.createdAt, Math.max(1, currentStage.position * randInt(1, 3)));
    const updatedAt = status === 'in_progress' ? reachedAt : addDays(reachedAt, randInt(1, 5));
    return {
      id,
      candidateDraft,
      currentStage,
      status,
      reachedAt,
      updatedAt,
      row: {
        id,
        company_id: input.companyId,
        job_opening_id: candidateDraft.job.id,
        candidate_id: candidateDraft.id,
        current_stage_id: currentStage.id,
        status,
        rejection_reason: status === 'rejected' ? rejectionReason() : null,
        withdrawal_reason: status === 'withdrawn' ? withdrawalReason() : null,
        reason_other: null,
        frozen_reason_notes: null,
        stage_entered_at: iso(reachedAt),
        created_at: iso(candidateDraft.createdAt),
        updated_at: iso(updatedAt),
      } satisfies TablesInsert<'job_applications'>,
    };
  });

  const applications = await insertRows(
    supabase,
    'job_applications',
    appDrafts.map((application) => application.row),
    'candidaturas',
  );
  const applicationById = new Map(applications.map((application) => [application.id, application]));

  const historyRows: TablesInsert<'candidate_stage_history'>[] = [];
  for (const appDraft of appDrafts) {
    const visited = stagesByPosition.filter((stage) => stage.position <= appDraft.currentStage.position);
    let previous: RecruitmentStageRow | null = null;
    visited.forEach((stage, stageIndex) => {
      historyRows.push({
        application_id: appDraft.id,
        from_stage_id: previous?.id ?? null,
        to_stage_id: stage.id,
        status_change: null,
        synthetic: false,
        changed_at: iso(addDays(appDraft.candidateDraft.createdAt, stageIndex * randInt(1, 3))),
        changed_by: input.adminUserId,
      });
      previous = stage;
    });
    if (appDraft.status === 'rejected' || appDraft.status === 'withdrawn') {
      historyRows.push({
        application_id: appDraft.id,
        from_stage_id: appDraft.currentStage.id,
        to_stage_id: null,
        status_change: { from: 'in_progress', to: appDraft.status },
        reason_code: appDraft.row.rejection_reason ?? appDraft.row.withdrawal_reason ?? null,
        reason_notes: appDraft.status === 'rejected'
          ? 'Processo encerrado após avaliação do perfil para a vaga.'
          : 'Candidatura retirada durante o processo seletivo.',
        synthetic: false,
        changed_at: iso(appDraft.updatedAt),
        changed_by: input.adminUserId,
      });
    }
  }
  await insertRows(supabase, 'candidate_stage_history', historyRows, 'histórico de etapas');

  const advancedApps = appDrafts.filter((app) => app.currentStage.position >= 3);
  const scorecardApps = pickN(advancedApps, 15);
  const scorecardRows: TablesInsert<'candidate_scorecards'>[] = [];
  for (const app of scorecardApps) {
    const application = applicationById.get(app.id);
    if (!application) continue;
    const job = jobs.find((candidateJob) => candidateJob.id === app.candidateDraft.job.id) ?? app.candidateDraft.job;
    const manager = input.employees.find((employee) => employee.id === job.hiring_manager_id) ?? input.gestorEmployee;
    const authors = [manager, input.adminEmployee].filter((employee, index, arr) =>
      arr.findIndex((candidate) => candidate.id === employee.id) === index
    );
    const count = faker.datatype.boolean({ probability: 0.35 }) && authors.length > 1 ? 2 : 1;
    for (let index = 0; index < count; index += 1) {
      scorecardRows.push({
        company_id: input.companyId,
        application_id: application.id,
        stage_id: app.currentStage.id,
        author_id: authors[index % authors.length].id,
        rating_communication: randInt(3, 5),
        rating_experience: randInt(2, 5),
        rating_role_fit: randInt(3, 5),
        rating_culture_fit: randInt(3, 5),
        salary_expectation: weightedPick([
          ['compatible', 75],
          ['incompatible', 25],
        ] as WeightedItem<'compatible' | 'incompatible'>[]),
        comment: 'Entrevista consistente, com boa compreensão do contexto de consultoria de crédito e pontos claros para aprofundamento.',
        recommendation: weightedPick([
          ['advance', 68],
          ['doubt', 22],
          ['reject', 10],
        ] as WeightedItem<'advance' | 'doubt' | 'reject'>[]),
        created_at: iso(addDays(app.reachedAt, 1)),
        updated_at: iso(addDays(app.reachedAt, 1)),
      });
    }
  }
  await insertRows(supabase, 'candidate_scorecards', scorecardRows, 'scorecards de candidatos');

  const feedbackRows: TablesInsert<'candidate_feedbacks'>[] = [];
  for (const app of pickN(advancedApps, 10)) {
    feedbackRows.push({
      company_id: input.companyId,
      application_id: app.id,
      stage_id: app.currentStage.id,
      author_id: input.gestorEmployee.id,
      content: 'Candidato demonstrou boa escuta, repertório suficiente para a etapa e capacidade de explicar temas financeiros com clareza.',
      recommendation: weightedPick([
        ['advance', 65],
        ['doubt', 25],
        ['reject', 10],
      ] as WeightedItem<'advance' | 'doubt' | 'reject'>[]),
      created_at: iso(addDays(app.reachedAt, 2)),
      updated_at: iso(addDays(app.reachedAt, 2)),
    });
  }
  await insertRows(supabase, 'candidate_feedbacks', feedbackRows, 'feedbacks de entrevista');

  const activeApps = appDrafts.filter((app) => app.status === 'in_progress' && app.currentStage.position >= 2);
  const taskRows: TablesInsert<'candidate_tasks'>[] = [];
  for (const [index, app] of pickN(activeApps, 8).entries()) {
    const job = jobs.find((candidateJob) => candidateJob.id === app.candidateDraft.job.id) ?? app.candidateDraft.job;
    const manager = input.employees.find((employee) => employee.id === job.hiring_manager_id) ?? input.gestorEmployee;
    const responsible = index < 3 ? input.gestorEmployee : manager;
    taskRows.push({
      company_id: input.companyId,
      application_id: app.id,
      title: [
        'Agendar retorno com candidato',
        'Revisar pretensão salarial',
        'Enviar case técnico',
        'Coletar parecer do gestor',
        'Confirmar disponibilidade de agenda',
        'Atualizar observações da entrevista',
        'Validar documentação inicial',
        'Preparar proposta preliminar',
      ][index],
      due_date: isoDate(addDays(ANCHOR_DATE, index < 4 ? -randInt(1, 6) : randInt(2, 10))),
      responsible_id: responsible.id,
      created_by: input.adminEmployee.id,
      created_at: iso(addDays(app.reachedAt, 1)),
      updated_at: iso(addDays(app.reachedAt, 1)),
    });
  }
  await insertRows(supabase, 'candidate_tasks', taskRows, 'tarefas de recrutamento');

  return {
    jobs,
    candidates: Array.from(candidateById.values()),
    applications,
  };
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável ${name} não encontrada. Confira o arquivo .env.local.`);
  }
  return value;
}

async function main() {
  loadEnvLocal();
  const { suffix, seed } = parseArgs();
  if (seed !== null) faker.seed(seed);

  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const demoEmails = {
    admin: makeDemoEmail('admin', suffix),
    gestor: makeDemoEmail('gestor', suffix),
    colab: makeDemoEmail('colab', suffix),
  };

  step('Checando emails demo no Auth.');
  await assertDemoEmailsAvailable(supabase, Object.values(demoEmails));

  step('Criando empresa demo.');
  const company = await insertOne(supabase, 'companies', DEMO_COMPANY, 'empresa demo');
  createdCompanyId = company.id;

  step('Criando usuários Auth e profiles.');
  const authUsers = await createDemoAuthUsers(supabase, suffix);
  await insertRows(
    supabase,
    'profiles',
    (Object.keys(authUsers) as DemoLoginKey[]).map((key) => ({
      id: authUsers[key].id,
      company_id: company.id,
      role: authUsers[key].role,
      full_name: authUsers[key].fullName,
    })),
    'profiles demo',
  );

  step('Criando departamentos, cargos e competências.');
  const departments = await insertRows(
    supabase,
    'departments',
    DEPARTMENTS.map((name) => ({ company_id: company.id, name })),
    'departamentos',
  );
  const positions = await insertRows(
    supabase,
    'positions',
    POSITIONS.map((name) => ({ company_id: company.id, name })),
    'cargos',
  );
  const competencies = await insertRows(
    supabase,
    'competencies',
    COMPETENCIES.map((competency) => ({
      company_id: company.id,
      name: competency.name,
      description: competency.description,
    })),
    'competências',
  );

  const departmentIds = new Map(departments.map((department) => [department.name, department.id]));
  const departmentNameById = new Map(departments.map((department) => [department.id, department.name as DepartmentName]));
  const positionIds = new Map(positions.map((position) => [position.name, position.id]));
  const positionNameById = new Map(positions.map((position) => [position.id, position.name]));
  const competencyIds = new Map(competencies.map((competency) => [competency.name, competency.id]));

  step('Criando 60 colaboradores e hierarquia.');
  const { managerRows } = buildEmployeeRows(company.id, authUsers, departmentIds, positionIds);
  const insertedManagerRows = await insertRows(supabase, 'employees', managerRows, 'gestores');
  const managers = attachEmployeeMeta(insertedManagerRows, departmentNameById, positionNameById, demoEmails);
  const staffRows = buildStaffRows(company.id, authUsers, departmentIds, positionIds, managers);
  const insertedStaffRows = await insertRows(supabase, 'employees', staffRows, 'colaboradores');
  const employees = [
    ...managers,
    ...attachEmployeeMeta(insertedStaffRows, departmentNameById, positionNameById, demoEmails),
  ];
  const adminEmployee = employees.find((employee) => employee.demoKey === 'admin');
  const gestorEmployee = employees.find((employee) => employee.demoKey === 'gestor');
  const colabEmployee = employees.find((employee) => employee.demoKey === 'colab');
  if (!adminEmployee || !gestorEmployee || !colabEmployee) {
    throw new Error('Não foi possível localizar os três colaboradores demo após inserts.');
  }

  step('Criando ciclos, formulários, perguntas e respostas de avaliação.');
  const cycleA = await insertOne(supabase, 'review_cycles', {
    company_id: company.id,
    name: 'Avaliação Q4/2025',
    description: 'Ciclo fechado para demonstrar histórico consolidado de desempenho.',
    period_start: '2025-10-01',
    period_end: '2025-12-31',
    response_start: '2026-01-05',
    response_end: '2026-01-31',
    status: 'closed',
    include_self: true,
    include_manager: true,
    created_by: authUsers.admin.id,
    published_at: '2026-01-05T12:00:00.000Z',
    closed_at: '2026-01-31T20:00:00.000Z',
    created_at: '2026-01-02T12:00:00.000Z',
    updated_at: '2026-01-31T20:00:00.000Z',
  }, 'ciclo Q4/2025');
  const cycleB = await insertOne(supabase, 'review_cycles', {
    company_id: company.id,
    name: 'Avaliação Q1/2026',
    description: 'Ciclo ativo com progresso parcial para demonstração de pendências e respostas em andamento.',
    period_start: '2026-01-01',
    period_end: '2026-03-31',
    response_start: '2026-04-15',
    response_end: '2026-05-31',
    status: 'published',
    include_self: true,
    include_manager: true,
    created_by: authUsers.admin.id,
    published_at: '2026-04-15T12:00:00.000Z',
    created_at: '2026-04-10T12:00:00.000Z',
    updated_at: '2026-04-15T12:00:00.000Z',
  }, 'ciclo Q1/2026');
  const formA = await insertOne(supabase, 'review_forms', {
    company_id: company.id,
    cycle_id: cycleA.id,
  }, 'formulário Q4/2025');
  const formB = await insertOne(supabase, 'review_forms', {
    company_id: company.id,
    cycle_id: cycleB.id,
  }, 'formulário Q1/2026');
  const questionsA = await insertRows(
    supabase,
    'review_questions',
    applyCompetencyIdsToQuestions(buildReviewQuestionRows(company.id, formA.id), competencyIds),
    'perguntas Q4/2025',
  );
  const questionsB = await insertRows(
    supabase,
    'review_questions',
    applyCompetencyIdsToQuestions(buildReviewQuestionRows(company.id, formB.id), competencyIds),
    'perguntas Q1/2026',
  );
  await seedReviewCycle(supabase, {
    companyId: company.id,
    adminUserId: authUsers.admin.id,
    cycle: cycleA,
    form: formA,
    questions: questionsA,
    participants: selectParticipants(employees, 'closed'),
    mode: 'closed',
    colabEmployeeId: colabEmployee.id,
    gestorEmployeeId: gestorEmployee.id,
  });
  await seedReviewCycle(supabase, {
    companyId: company.id,
    adminUserId: authUsers.admin.id,
    cycle: cycleB,
    form: formB,
    questions: questionsB,
    participants: selectParticipants(employees, 'active'),
    mode: 'active',
    colabEmployeeId: colabEmployee.id,
    gestorEmployeeId: gestorEmployee.id,
  });

  step('Criando feedbacks e PDIs.');
  await insertRows(
    supabase,
    'feedbacks',
    buildFeedbackRows(company.id, employees, competencyIds),
    'feedbacks',
  );
  await seedPdis(supabase, {
    companyId: company.id,
    adminUserId: authUsers.admin.id,
    cycleAId: cycleA.id,
    employees,
    competencyIds,
  });

  step('Buscando etapas automáticas e criando vagas/candidatos.');
  const { data: stages, error: stagesError } = await supabase
    .from('recruitment_stages')
    .select('*')
    .eq('company_id', company.id)
    .order('position', { ascending: true });
  if (stagesError) {
    throw new Error(`Falha ao buscar recruitment_stages: ${supabaseErrorMessage(stagesError)}`);
  }
  if (!stages || stages.length !== 7) {
    throw new Error(`Trigger de recruitment_stages retornou ${stages?.length ?? 0} etapas; esperado: 7.`);
  }
  const recruitment = await seedRecruitment(supabase, {
    companyId: company.id,
    adminUserId: authUsers.admin.id,
    adminEmployee,
    gestorEmployee,
    employees,
    departmentsByName: departmentIds,
    positionsByName: positionIds,
    stages,
  });

  console.log('');
  console.log(`✓ Empresa criada: ${company.name} (id: ${company.id})`);
  console.log('');
  console.log(`  Logins demo (senha: ${DEMO_PASSWORD}):`);
  console.log(`    admin   → ${authUsers.admin.email}   (admin_rh)`);
  console.log(`    gestor  → ${authUsers.gestor.email}  (director, Gerente Comercial)`);
  console.log(`    colab   → ${authUsers.colab.email}   (user, Consultor Comercial Pleno)`);
  console.log('');
  console.log('  Conteúdo:');
  console.log(`    ${employees.length} colaboradores · ${departments.length} departamentos · ${positions.length} cargos · ${competencies.length} competências`);
  console.log('    2 ciclos de avaliação (1 fechado · 1 ativo)');
  console.log('    150 feedbacks · 25 PDIs');
  console.log(`    ${recruitment.jobs.length} vagas · ${recruitment.candidates.length} candidatos espalhados no funil`);
  console.log('');
  console.log('  Para apagar: ver instruções no rodapé de scripts/mock-demo-company.ts');
}

main().catch((error: unknown) => {
  console.error('');
  console.error('✗ Seed interrompido.');
  if (createdCompanyId) {
    console.error(`  Empresa criada antes do erro: ${createdCompanyId}`);
    console.error('  Use a sequência de limpeza no rodapé deste script antes de tentar novamente.');
  }
  console.error(`  ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

/*
Como apagar a empresa demo manualmente via Supabase Studio

Após pegar o <companyId> no resumo do terminal, ou consultar:

  SELECT id, name FROM companies WHERE name LIKE 'Vértice%';

Rode no SQL Editor:

  -- 1a) Identificar usuários demo
  SELECT id, email FROM auth.users
  WHERE email IN ('admin@vertice-demo.local',
                  'gestor@vertice-demo.local',
                  'colab@vertice-demo.local');

  -- 1b) Apagar tabelas de recrutamento que referenciam recruitment_stages
  --     sem cascade direto; isso libera o DELETE da company.
  DELETE FROM candidate_tasks
  WHERE company_id = '<companyId>';

  DELETE FROM candidate_scorecards
  WHERE company_id = '<companyId>';

  DELETE FROM candidate_feedbacks
  WHERE company_id = '<companyId>';

  DELETE FROM candidate_stage_history
  WHERE application_id IN (
    SELECT id FROM job_applications WHERE company_id = '<companyId>'
  );

  -- 1c) Apagar profiles desses usuários (libera RESTRICT em companies)
  DELETE FROM profiles
  WHERE company_id = '<companyId>';

  -- 1d) Apagar empresa (cascateia departamentos, cargos, colaboradores,
  --     avaliações, feedbacks, PDIs, vagas, candidatos e candidaturas)
  DELETE FROM companies WHERE id = '<companyId>';

  -- 1e) Apagar auth.users dos 3 demos
  DELETE FROM auth.users
  WHERE email IN ('admin@vertice-demo.local',
                  'gestor@vertice-demo.local',
                  'colab@vertice-demo.local');

Se você rodou com --suffix=v2, ajuste os emails para:
  admin+v2@vertice-demo.local
  gestor+v2@vertice-demo.local
  colab+v2@vertice-demo.local
*/
