import { useDataValue, useData } from "@json-render/react";
import type { Action } from "@json-render/core";
import type { ReactNode } from "react";

// Types for component props
interface ElementProps<T> {
  element: { props: T; key: string };
  children?: ReactNode;
  onAction?: (action: Action) => void;
}

// Layout Components
export function Card({ element, children }: ElementProps<{ title: string; subtitle?: string }>) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{element.props.title}</h3>
        {element.props.subtitle && (
          <p className="card-subtitle">{element.props.subtitle}</p>
        )}
      </div>
      <div className="card-content">{children}</div>
    </div>
  );
}

export function Grid({ element, children }: ElementProps<{ columns: number; gap: string }>) {
  const gapMap = { sm: "0.5rem", md: "1rem", lg: "1.5rem" };
  return (
    <div
      className="grid"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${element.props.columns || 2}, 1fr)`,
        gap: gapMap[element.props.gap as keyof typeof gapMap] || "1rem",
      }}
    >
      {children}
    </div>
  );
}

export function Section({ element, children }: ElementProps<{ title: string; collapsible?: boolean }>) {
  return (
    <section className="section">
      <h2 className="section-title">{element.props.title}</h2>
      <div className="section-content">{children}</div>
    </section>
  );
}

// Data Display Components
export function Metric({ element }: ElementProps<{ label: string; valuePath: string; format: string; trend?: string }>) {
  const value = useDataValue(element.props.valuePath);

  const formatValue = (val: unknown) => {
    if (val === undefined || val === null) return "—";
    switch (element.props.format) {
      case "currency":
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(val));
      case "percent":
        return `${(Number(val) * 100).toFixed(1)}%`;
      case "number":
        return new Intl.NumberFormat("en-US").format(Number(val));
      default:
        return String(val);
    }
  };

  const trendIcon = element.props.trend === "up" ? "↑" : element.props.trend === "down" ? "↓" : "";
  const trendClass = element.props.trend || "";

  return (
    <div className="metric">
      <span className="metric-label">{element.props.label}</span>
      <span className={`metric-value ${trendClass}`}>
        {formatValue(value)} {trendIcon}
      </span>
    </div>
  );
}

export function Text({ element }: ElementProps<{ content: string; variant: string }>) {
  const className = `text text-${element.props.variant || "body"}`;
  return <p className={className}>{element.props.content}</p>;
}

export function Badge({ element }: ElementProps<{ label: string; variant: string }>) {
  return (
    <span className={`badge badge-${element.props.variant || "info"}`}>
      {element.props.label}
    </span>
  );
}

export function Alert({ element }: ElementProps<{ message: string; variant: string; dismissible?: boolean }>) {
  return (
    <div className={`alert alert-${element.props.variant || "info"}`} role="alert">
      <span>{element.props.message}</span>
      {element.props.dismissible && (
        <button className="alert-dismiss" aria-label="Dismiss">×</button>
      )}
    </div>
  );
}

// Interactive Components
export function Button({ element, onAction }: ElementProps<{ label: string; action: Action; variant: string; disabled?: boolean }>) {
  return (
    <button
      className={`btn btn-${element.props.variant || "primary"}`}
      disabled={element.props.disabled}
      onClick={() => onAction?.(element.props.action)}
    >
      {element.props.label}
    </button>
  );
}

export function TextField({ element }: ElementProps<{
  label: string;
  valuePath: string;
  placeholder?: string;
  type?: string;
}>) {
  const value = useDataValue<string>(element.props.valuePath) || "";
  const { set } = useData();

  return (
    <div className="form-field">
      <label className="form-label">{element.props.label}</label>
      <input
        type={element.props.type || "text"}
        className="form-input"
        placeholder={element.props.placeholder}
        value={value}
        onChange={(e) => set(element.props.valuePath, e.target.value)}
      />
    </div>
  );
}

export function Select({ element }: ElementProps<{
  label: string;
  valuePath: string;
  options: Array<{ value: string; label: string }>;
}>) {
  const value = useDataValue<string>(element.props.valuePath) || "";
  const { set } = useData();

  return (
    <div className="form-field">
      <label className="form-label">{element.props.label}</label>
      <select
        className="form-select"
        value={value}
        onChange={(e) => set(element.props.valuePath, e.target.value)}
      >
        <option value="">Select...</option>
        {element.props.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Checkbox({ element }: ElementProps<{ label: string; valuePath: string }>) {
  const value = useDataValue<boolean>(element.props.valuePath) || false;
  const { set } = useData();

  return (
    <label className="checkbox">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => set(element.props.valuePath, e.target.checked)}
      />
      <span>{element.props.label}</span>
    </label>
  );
}

// Data Visualization
export function ProgressBar({ element }: ElementProps<{ valuePath: string; max: number; label?: string; color: string }>) {
  const value = useDataValue<number>(element.props.valuePath) || 0;
  const max = element.props.max || 100;
  const percent = Math.min(100, (value / max) * 100);

  return (
    <div className="progress">
      {element.props.label && <span className="progress-label">{element.props.label}</span>}
      <div className="progress-bar">
        <div
          className={`progress-fill progress-${element.props.color || "blue"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="progress-value">{value}/{max}</span>
    </div>
  );
}

export function DataTable({ element }: ElementProps<{
  dataPath: string;
  columns: Array<{ key: string; label: string; format: string }>;
}>) {
  const data = useDataValue<Array<Record<string, unknown>>>(element.props.dataPath) || [];

  const formatCell = (value: unknown, format: string) => {
    if (value === undefined || value === null) return "—";
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));
      case "date":
        return new Date(String(value)).toLocaleDateString();
      case "number":
        return new Intl.NumberFormat("en-US").format(Number(value));
      default:
        return String(value);
    }
  };

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {element.props.columns?.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {element.props.columns?.map((col) => (
                <td key={col.key}>{formatCell(row[col.key], col.format)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Export registry
export const componentRegistry = {
  Card,
  Grid,
  Section,
  Metric,
  Text,
  Badge,
  Alert,
  Button,
  TextField,
  Select,
  Checkbox,
  ProgressBar,
  DataTable,
};
