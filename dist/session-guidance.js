// Tutor instructions describe the workflow, never the assessment's expected answer.
export function guidedInstruction(s) {
  if (!s) return 'Back up the workspace before attempting recovery.';
  if (s.stage === 'setup') return 'Confirm the learner nickname above. Choose the focus and record the device, then save the plan.';
  if (['before', 'after', 'nextday'].includes(s.stage)) {
    const phase = s.phases?.[s.stage];
    if (!phase) return 'This session needs review. Back up the workspace before continuing.';
    if (phase.confidence === null) return 'Ask the confidence question neutrally. Record the response, or skip it.';
    if (phase.answers.length < 3) return 'Present this task without teaching the answer. Record the first response and any help, then continue.';
    return `All first responses are saved. Add optional supported responses and finish the ${s.stage === 'nextday' ? 'next-day' : s.stage} tasks.`;
  }
  return ({
    play: 'Open the mission and record support as needed. Return here when the learner finishes.',
    waiting: 'Return at the time shown below. Missing next-day responses remain unrecorded.',
    complete: 'Review the recorded results and download the workbook or summary CSV.'
  })[s.stage] || 'This session needs review. Back up the workspace before continuing.';
}
