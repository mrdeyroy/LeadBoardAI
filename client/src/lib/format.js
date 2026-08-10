export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?'
}

export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function timeAgo(value) {
  if (!value) return ''
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000)
  const minutes = Math.round(seconds / 60)
  if (minutes < 1) return 'just now'
  if (minutes === 1) return '1 minute ago'
  const hours = Math.round(minutes / 60)
  if (hours < 1) return `${minutes} minutes ago`
  if (hours === 1) return '1 hour ago'
  const days = Math.round(hours / 24)
  if (days < 1) return `${hours} hours ago`
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  return formatDate(value)
}