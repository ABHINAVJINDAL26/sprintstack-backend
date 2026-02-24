/* eslint-disable no-console */
const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000/api';
const RUN_ID = Date.now();

const users = {
  admin: { name: 'Admin User', role: 'admin', email: `admin.${RUN_ID}@test.local`, password: 'Test123@' },
  manager: { name: 'Manager User', role: 'manager', email: `manager.${RUN_ID}@test.local`, password: 'Test123@' },
  developer: { name: 'Developer User', role: 'developer', email: `developer.${RUN_ID}@test.local`, password: 'Test123@' },
  qa: { name: 'QA User', role: 'qa', email: `qa.${RUN_ID}@test.local`, password: 'Test123@' },
};

function print(title, ok, details = '') {
  const status = ok ? 'PASS' : 'FAIL';
  console.log(`${status} | ${title}${details ? ` | ${details}` : ''}`);
}

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (_e) {
    data = null;
  }

  return { ok: res.ok, status: res.status, data };
}

async function registerAndLogin(user) {
  const reg = await request('/auth/register', {
    method: 'POST',
    body: {
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
    },
  });

  if (!reg.ok || !reg.data?.token) {
    throw new Error(`Unable to register ${user.role}: ${reg.status} ${JSON.stringify(reg.data)}`);
  }

  return reg.data.token;
}

(async function run() {
  console.log(`\nRBAC Smoke Test | ${API_BASE} | runId=${RUN_ID}\n`);

  try {
    const tokens = {};
    for (const role of Object.keys(users)) {
      tokens[role] = await registerAndLogin(users[role]);
      print(`Register ${role}`, true);
    }

    const createProject = await request('/projects', {
      method: 'POST',
      token: tokens.manager,
      body: {
        name: `RBAC Project ${RUN_ID}`,
        description: 'Smoke test project',
      },
    });

    const projectId = createProject.data?.project?._id;
    print('Manager creates project', createProject.ok, `status=${createProject.status}`);
    if (!createProject.ok || !projectId) throw new Error('Project creation failed; stopping tests.');

    const addDev = await request(`/projects/${projectId}/members`, {
      method: 'POST',
      token: tokens.manager,
      body: { email: users.developer.email },
    });
    print('Manager adds developer to team', addDev.ok, `status=${addDev.status}`);

    const addQa = await request(`/projects/${projectId}/members`, {
      method: 'POST',
      token: tokens.manager,
      body: { email: users.qa.email },
    });
    print('Manager adds QA to team', addQa.ok, `status=${addQa.status}`);

    const createSprint = await request('/sprints', {
      method: 'POST',
      token: tokens.manager,
      body: {
        projectId,
        name: `Sprint ${RUN_ID}`,
        startDate: '2026-02-24',
        endDate: '2026-03-10',
        goal: 'RBAC validation sprint',
      },
    });

    const sprintId = createSprint.data?.sprint?._id;
    print('Manager creates sprint', createSprint.ok, `status=${createSprint.status}`);
    if (!createSprint.ok || !sprintId) throw new Error('Sprint creation failed; stopping tests.');

    const createTaskDev = await request('/tasks', {
      method: 'POST',
      token: tokens.manager,
      body: {
        title: 'Developer owned task',
        description: 'Task for developer status update checks',
        projectId,
        sprintId,
        assignedTo: createProject.data?.project?.teamMembers?.find?.(() => false) || undefined,
        priority: 'high',
        status: 'backlog',
        storyPoints: 5,
      },
    });

    const createTaskQa = await request('/tasks', {
      method: 'POST',
      token: tokens.manager,
      body: {
        title: 'QA task',
        description: 'Task for qa transitions',
        projectId,
        sprintId,
        priority: 'medium',
        status: 'todo',
        storyPoints: 3,
      },
    });

    print('Manager creates tasks', createTaskDev.ok && createTaskQa.ok, `status=${createTaskDev.status}/${createTaskQa.status}`);

    const teamFetch = await request(`/projects/${projectId}`, { token: tokens.manager });
    const devMemberId = teamFetch.data?.project?.teamMembers?.find((m) => m.email === users.developer.email)?._id;
    const qaMemberId = teamFetch.data?.project?.teamMembers?.find((m) => m.email === users.qa.email)?._id;

    const assignDev = await request(`/tasks/${createTaskDev.data?.task?._id}`, {
      method: 'PUT',
      token: tokens.manager,
      body: { assignedTo: devMemberId },
    });
    print('Manager assigns task to developer', assignDev.ok, `status=${assignDev.status}`);

    const assignQa = await request(`/tasks/${createTaskQa.data?.task?._id}`, {
      method: 'PUT',
      token: tokens.manager,
      body: { assignedTo: qaMemberId },
    });
    print('Manager assigns task to QA', assignQa.ok, `status=${assignQa.status}`);

    const devOwnStatus = await request(`/tasks/${createTaskDev.data?.task?._id}`, {
      method: 'PUT',
      token: tokens.developer,
      body: { status: 'todo' },
    });
    print('Developer updates own assigned task status', devOwnStatus.ok, `status=${devOwnStatus.status}`);

    const devOtherStatus = await request(`/tasks/${createTaskQa.data?.task?._id}`, {
      method: 'PUT',
      token: tokens.developer,
      body: { status: 'in-progress' },
    });
    print('Developer blocked from updating unassigned task', !devOtherStatus.ok && devOtherStatus.status === 403, `status=${devOtherStatus.status}`);

    const managerToInProgress = await request(`/tasks/${createTaskQa.data?.task?._id}`, {
      method: 'PUT',
      token: tokens.manager,
      body: { status: 'in-progress' },
    });
    print('Manager moves QA task to in-progress', managerToInProgress.ok, `status=${managerToInProgress.status}`);

    const qaInvalid = await request(`/tasks/${createTaskQa.data?.task?._id}`, {
      method: 'PUT',
      token: tokens.qa,
      body: { status: 'todo' },
    });
    print('QA blocked from invalid status set', !qaInvalid.ok && qaInvalid.status === 403, `status=${qaInvalid.status}`);

    const qaToReview = await request(`/tasks/${createTaskQa.data?.task?._id}`, {
      method: 'PUT',
      token: tokens.qa,
      body: { status: 'review' },
    });
    print('QA moves task to review', qaToReview.ok, `status=${qaToReview.status}`);

    const qaToDone = await request(`/tasks/${createTaskQa.data?.task?._id}`, {
      method: 'PUT',
      token: tokens.qa,
      body: { status: 'done' },
    });
    print('QA moves task to done', qaToDone.ok, `status=${qaToDone.status}`);

    const sprintProgress = await request(`/sprints/${sprintId}/progress`, { token: tokens.manager });
    print('Sprint progress endpoint works', sprintProgress.ok, `progress=${sprintProgress.data?.progressPercent ?? 'n/a'}%`);

    const adminDelete = await request(`/tasks/${createTaskDev.data?.task?._id}`, {
      method: 'DELETE',
      token: tokens.admin,
    });
    print('Admin can delete task', adminDelete.ok, `status=${adminDelete.status}`);

    console.log('\nSmoke test complete. Review PASS/FAIL lines above.\n');
  } catch (error) {
    console.error(`FATAL | ${error.message}`);
    process.exitCode = 1;
  }
})();
