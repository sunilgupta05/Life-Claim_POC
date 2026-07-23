require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const adminService = require('../src/services/adminService');

async function main() {
  console.log('=== Admin DB smoke test ===\n');
  const summary = await adminService.getSummary();
  console.log('Summary:', {
    totalClaims: summary.totalClaims,
    pending: summary.pending,
    slaBreached: summary.sla?.breached,
    openByRoleList: summary.openByRoleClaims?.length,
  });

  for (const view of ['slaBreached', 'slaAtRisk', 'openByRole', 'rejected30d']) {
    const list = await adminService.getRecentClaims(10, view);
    console.log(`Claims view=${view}:`, list.length, 'rows');
  }

  const audit = await adminService.getAuditEvents({ limit: 5 });
  console.log('\nAudit events:', audit.length);
  if (audit[0]) console.log('Sample:', audit[0]);

  const tracked = await adminService.getTrackedUserStatuses();
  console.log('\nTracked users:', tracked.length);

  console.log('\nDone.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
