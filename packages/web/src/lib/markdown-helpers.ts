// Markdown helper utilities for the planning document

export const updateLastModified = (content: string): string => {
  const now = new Date();
  const dateString = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Replace the last updated line
  const lastUpdatedRegex = /\*Last updated: .*\*/;
  const newLastUpdated = `*Last updated: ${dateString}*`;

  if (lastUpdatedRegex.test(content)) {
    return content.replace(lastUpdatedRegex, newLastUpdated);
  }
  // Add it at the end if it doesn't exist
  return `${content}\n\n---\n\n${newLastUpdated}`;
};

export const getMarkdownStats = (content: string) => {
  const lines = content.split('\n');
  const headings = lines.filter((line) => line.startsWith('#')).length;
  const tasks = lines.filter(
    (line) =>
      line.includes('[ ]') || line.includes('[x]') || line.includes('[X]')
  ).length;
  const completedTasks = lines.filter(
    (line) => line.includes('[x]') || line.includes('[X]')
  ).length;

  return {
    totalLines: lines.length,
    headings,
    totalTasks: tasks,
    completedTasks,
    completionRate: tasks > 0 ? Math.round((completedTasks / tasks) * 100) : 0,
  };
};
