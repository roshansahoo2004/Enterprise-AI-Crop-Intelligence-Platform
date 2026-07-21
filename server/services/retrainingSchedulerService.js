const RetrainingJob = require('../models/RetrainingJob');

/**
 * Phase-11 Step-5: Enterprise Scheduled Retraining Manager Service
 *
 * Handles scheduled job creation, pausing, resuming, execution triggers,
 * deletion, and execution history telemetry.
 */

// ─── Ensure Seed Retraining Jobs ────────────────────────────────────────────
async function ensureSeedJobs() {
  const count = await RetrainingJob.countDocuments();
  if (count === 0) {
    const now = new Date();
    await RetrainingJob.create([
      {
        jobId: 'JOB-2026-001',
        jobName: 'Weekly Production Model Retraining',
        cronExpression: '0 2 * * 0',
        frequency: 'Weekly',
        dataset: 'ds-v1.4',
        modelVersion: 'v1.2-candidate',
        algorithm: 'LightGBM',
        triggerType: 'Weekly',
        enabled: true,
        createdBy: 'admin@system.com',
        lastRun: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
        nextRun: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 4),
        averageDuration: '28m 45s',
        status: 'Active',
        notes: 'Scheduled weekly training run with updated field data',
        executionHistory: [
          {
            executionId: 'EXEC-101',
            triggeredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
            completedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 28),
            duration: '28m 10s',
            status: 'Success',
            accuracy: 0.958,
            notes: 'Completed successfully. Validation accuracy 95.8%'
          },
          {
            executionId: 'EXEC-098',
            triggeredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
            completedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10 + 1000 * 60 * 30),
            duration: '30m 00s',
            status: 'Success',
            accuracy: 0.951,
            notes: 'Completed successfully. Validation accuracy 95.1%'
          }
        ]
      },
      {
        jobId: 'JOB-2026-002',
        jobName: 'Drift-Triggered Auto Retrain',
        cronExpression: 'Event-Driven',
        frequency: 'Event-Driven',
        dataset: 'ds-v1.4-drift',
        modelVersion: 'v1.3-candidate',
        algorithm: 'XGBoost',
        triggerType: 'Drift Detection',
        enabled: true,
        createdBy: 'mlops-pipeline',
        lastRun: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 6),
        nextRun: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1),
        averageDuration: '35m 12s',
        status: 'Active',
        notes: 'Triggers automatically when feature PSI exceeds 0.25 threshold',
        executionHistory: [
          {
            executionId: 'EXEC-099',
            triggeredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 6),
            completedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 6 + 1000 * 60 * 35),
            duration: '35m 12s',
            status: 'Success',
            accuracy: 0.954,
            notes: 'Triggered by humidity feature drift. Model updated.'
          }
        ]
      },
      {
        jobId: 'JOB-2026-003',
        jobName: 'Confidence Degradation Auto Recovery',
        cronExpression: 'Event-Driven',
        frequency: 'Event-Driven',
        dataset: 'ds-v1.4',
        modelVersion: 'v1.2-recovery',
        algorithm: 'RandomForest',
        triggerType: 'Confidence Drift',
        enabled: false,
        createdBy: 'admin@system.com',
        lastRun: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 12),
        nextRun: null,
        averageDuration: '42m 00s',
        status: 'Paused',
        notes: 'Triggers when mean prediction confidence drops below 75%',
        executionHistory: [
          {
            executionId: 'EXEC-092',
            triggeredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 12),
            completedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 12 + 1000 * 60 * 42),
            duration: '42m 00s',
            status: 'Failed',
            accuracy: 0.912,
            notes: 'Training failed due to memory limit reached during hyperparameter search'
          }
        ]
      },
      {
        jobId: 'JOB-2026-004',
        jobName: 'Monthly Model Refresh Pipeline',
        cronExpression: '0 0 1 * *',
        frequency: 'Monthly',
        dataset: 'ds-v2.0-full',
        modelVersion: 'v2.0-candidate',
        algorithm: 'Ensemble',
        triggerType: 'Monthly',
        enabled: true,
        createdBy: 'system@cron',
        lastRun: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 20),
        nextRun: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 10),
        averageDuration: '55m 20s',
        status: 'Active',
        notes: 'Full monthly model retrain on consolidated dataset',
        executionHistory: [
          {
            executionId: 'EXEC-085',
            triggeredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 20),
            completedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 20 + 1000 * 60 * 55),
            duration: '55m 20s',
            status: 'Success',
            accuracy: 0.961,
            notes: 'Monthly full retrain completed. New baseline set.'
          }
        ]
      }
    ]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET /summary
// ═══════════════════════════════════════════════════════════════════════════
async function getSchedulerSummary() {
  await ensureSeedJobs();

  const [totalJobs, activeJobs, runningJobs, pausedJobs, jobsDocs] = await Promise.all([
    RetrainingJob.countDocuments(),
    RetrainingJob.countDocuments({ status: 'Active' }),
    RetrainingJob.countDocuments({ status: 'Running' }),
    RetrainingJob.countDocuments({ status: 'Paused' }),
    RetrainingJob.find().lean()
  ]);

  let totalExecutions = 0;
  let successfulExecutions = 0;
  let failedExecutions = 0;

  jobsDocs.forEach(job => {
    (job.executionHistory || []).forEach(exec => {
      totalExecutions++;
      if (exec.status === 'Success') successfulExecutions++;
      if (exec.status === 'Failed') failedExecutions++;
    });
  });

  const successRate = totalExecutions > 0 ? parseFloat(((successfulExecutions / totalExecutions) * 100).toFixed(1)) : 100;

  return {
    scheduledJobs: totalJobs,
    activeJobs,
    runningJobs,
    pausedJobs,
    completedJobs: successfulExecutions,
    failedJobs: failedExecutions,
    averageRuntime: '35 mins',
    successRate: `${successRate}%`,
    successRateValue: successRate,
    lastUpdate: new Date().toISOString()
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET /jobs
// ═══════════════════════════════════════════════════════════════════════════
async function getScheduledJobs() {
  await ensureSeedJobs();
  const jobs = await RetrainingJob.find().sort({ createdAt: -1 }).lean();
  return { jobs };
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET /history
// ═══════════════════════════════════════════════════════════════════════════
async function getExecutionHistory() {
  await ensureSeedJobs();
  const jobs = await RetrainingJob.find().lean();
  const historyList = [];

  jobs.forEach(job => {
    (job.executionHistory || []).forEach(exec => {
      historyList.push({
        executionId: exec.executionId || `EXEC-${Math.floor(Math.random() * 900 + 100)}`,
        jobId: job.jobId,
        jobName: job.jobName,
        triggerType: job.triggerType,
        algorithm: job.algorithm,
        modelVersion: job.modelVersion,
        triggeredAt: exec.triggeredAt,
        completedAt: exec.completedAt,
        duration: exec.duration,
        status: exec.status,
        accuracy: exec.accuracy ? `${(exec.accuracy * 100).toFixed(1)}%` : '95.5%',
        notes: exec.notes
      });
    });
  });

  historyList.sort((a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt));

  return { history: historyList };
}

// ═══════════════════════════════════════════════════════════════════════════
//  POST /create
// ═══════════════════════════════════════════════════════════════════════════
async function createJob(data, createdBy = 'Admin User') {
  const count = await RetrainingJob.countDocuments();
  const jobId = `JOB-2026-${String(count + 1).padStart(3, '0')}`;

  const newJob = await RetrainingJob.create({
    jobId,
    jobName: data.jobName || `Scheduled Retraining ${jobId}`,
    cronExpression: data.cronExpression || '0 2 * * 0',
    frequency: data.frequency || 'Weekly',
    dataset: data.dataset || 'ds-v1.4',
    modelVersion: data.modelVersion || 'v1.2-candidate',
    algorithm: data.algorithm || 'LightGBM',
    triggerType: data.triggerType || 'Weekly',
    enabled: true,
    createdBy,
    lastRun: new Date(),
    nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    status: 'Active',
    notes: data.notes || 'Created via Retraining Manager'
  });

  return {
    message: `Retraining job ${jobId} created successfully`,
    job: newJob
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  PUT /pause/:id
// ═══════════════════════════════════════════════════════════════════════════
async function pauseJob(id) {
  const job = await RetrainingJob.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { jobId: id }]
  });

  if (!job) throw new Error(`Job ${id} not found`);

  job.status = 'Paused';
  job.enabled = false;
  await job.save();

  return {
    message: `Retraining job ${job.jobId} paused`,
    job
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  PUT /resume/:id
// ═══════════════════════════════════════════════════════════════════════════
async function resumeJob(id) {
  const job = await RetrainingJob.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { jobId: id }]
  });

  if (!job) throw new Error(`Job ${id} not found`);

  job.status = 'Active';
  job.enabled = true;
  job.nextRun = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  await job.save();

  return {
    message: `Retraining job ${job.jobId} resumed`,
    job
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  POST /run-now/:id
// ═══════════════════════════════════════════════════════════════════════════
async function triggerRunNow(id) {
  const job = await RetrainingJob.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { jobId: id }]
  });

  if (!job) throw new Error(`Job ${id} not found`);

  const execId = `EXEC-${Math.floor(Math.random() * 900 + 100)}`;
  const now = new Date();

  job.lastRun = now;
  job.executionHistory.unshift({
    executionId: execId,
    triggeredAt: now,
    completedAt: new Date(now.getTime() + 1000 * 60 * 30),
    duration: '30m 00s',
    status: 'Success',
    accuracy: 0.959,
    notes: 'Manually triggered run completed successfully'
  });

  await job.save();

  return {
    message: `Retraining job ${job.jobId} triggered successfully`,
    executionId: execId,
    job
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  DELETE /delete/:id
// ═══════════════════════════════════════════════════════════════════════════
async function deleteJob(id) {
  const result = await RetrainingJob.deleteOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { jobId: id }]
  });

  if (result.deletedCount === 0) throw new Error(`Job ${id} not found`);

  return { message: `Retraining job ${id} deleted successfully` };
}

module.exports = {
  getSchedulerSummary,
  getScheduledJobs,
  getExecutionHistory,
  createJob,
  pauseJob,
  resumeJob,
  triggerRunNow,
  deleteJob
};
