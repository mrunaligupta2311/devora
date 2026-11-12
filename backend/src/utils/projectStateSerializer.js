const displayStatus = {
  SAVED: "Saved",
  PLANNING: "Planning",
  IN_PROGRESS: "In Progress",
  DONE: "Completed",
  HIDDEN: "Hidden",
};

export function serializeUserProjectState({ project, status, ...state }) {
  return {
    ...state,
    ...project,
    status: displayStatus[status] || status,
  };
}
