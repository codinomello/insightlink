import type { ReactNode } from 'react';

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="empty fade">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

export function StatsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="stats is-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div className="stat" key={i}>
          <div className="skeleton" style={{ height: 12, width: '55%' }} />
          <div className="skeleton" style={{ height: 34, width: '40%', marginTop: 14 }} />
        </div>
      ))}
    </div>
  );
}

export function PanelSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="panel">
      <div className="panel-body">
        <div className="skeleton" style={{ height: 14, width: 160 }} />
        <div className="skeleton" style={{ height, marginTop: 18 }} />
      </div>
    </div>
  );
}
