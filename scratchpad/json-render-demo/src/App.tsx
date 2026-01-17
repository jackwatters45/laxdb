import { useState } from "react";
import { DataProvider, ActionProvider, VisibilityProvider, Renderer } from "@json-render/react";
import type { UITree, Action } from "@json-render/core";
import { componentRegistry } from "./components";
import "./App.css";

// Helper to build flat UITree from nested structure
function buildTree(nested: NestedElement): UITree {
  const elements: UITree["elements"] = {};
  let keyCounter = 0;

  function processElement(el: NestedElement, parentKey: string | null = null): string {
    const key = `e${keyCounter++}`;
    const childKeys: string[] = [];

    if (el.children) {
      for (const child of el.children) {
        childKeys.push(processElement(child, key));
      }
    }

    elements[key] = {
      key,
      type: el.type,
      props: el.props,
      children: childKeys.length > 0 ? childKeys : undefined,
      parentKey,
    };

    return key;
  }

  const rootKey = processElement(nested);
  return { root: rootKey, elements };
}

interface NestedElement {
  type: string;
  props: Record<string, unknown>;
  children?: NestedElement[];
}

// Sample nested structures (easier to write, converted to flat UITree)
const nestedTrees: Record<string, NestedElement> = {
  dashboard: {
    type: "Section",
    props: { title: "Sales Dashboard" },
    children: [
      {
        type: "Grid",
        props: { columns: 3, gap: "md" },
        children: [
          {
            type: "Card",
            props: { title: "Revenue", subtitle: "This month" },
            children: [
              { type: "Metric", props: { label: "Total", valuePath: "/metrics/revenue", format: "currency", trend: "up" } },
            ],
          },
          {
            type: "Card",
            props: { title: "Growth", subtitle: "YoY" },
            children: [
              { type: "Metric", props: { label: "Rate", valuePath: "/metrics/growth", format: "percent", trend: "up" } },
            ],
          },
          {
            type: "Card",
            props: { title: "Customers", subtitle: "Active" },
            children: [
              { type: "Metric", props: { label: "Count", valuePath: "/metrics/customers", format: "number" } },
            ],
          },
        ],
      },
      {
        type: "Card",
        props: { title: "Sales Progress" },
        children: [
          { type: "ProgressBar", props: { valuePath: "/metrics/salesProgress", max: 100, label: "Q1 Target", color: "green" } },
        ],
      },
      {
        type: "Grid",
        props: { columns: 2, gap: "md" },
        children: [
          { type: "Button", props: { label: "Export Report", action: { name: "export_data" }, variant: "primary" } },
          { type: "Button", props: { label: "Refresh Data", action: { name: "refresh_data" }, variant: "secondary" } },
        ],
      },
    ],
  },

  form: {
    type: "Card",
    props: { title: "Contact Form", subtitle: "Get in touch" },
    children: [
      { type: "TextField", props: { label: "Name", valuePath: "/form/name", placeholder: "Enter your name" } },
      { type: "TextField", props: { label: "Email", valuePath: "/form/email", placeholder: "you@example.com", type: "email" } },
      {
        type: "Select",
        props: {
          label: "Topic",
          valuePath: "/form/topic",
          options: [
            { value: "sales", label: "Sales Inquiry" },
            { value: "support", label: "Technical Support" },
            { value: "other", label: "Other" },
          ],
        },
      },
      { type: "Checkbox", props: { label: "Subscribe to newsletter", valuePath: "/form/subscribe" } },
      {
        type: "Grid",
        props: { columns: 2, gap: "sm" },
        children: [
          { type: "Button", props: { label: "Submit", action: { name: "submit_form" }, variant: "primary" } },
          { type: "Button", props: { label: "Reset", action: { name: "reset_form" }, variant: "secondary" } },
        ],
      },
    ],
  },

  dataTable: {
    type: "Section",
    props: { title: "Recent Orders" },
    children: [
      { type: "Alert", props: { message: "3 orders pending review", variant: "warning" } },
      {
        type: "DataTable",
        props: {
          dataPath: "/orders",
          columns: [
            { key: "id", label: "Order ID", format: "text" },
            { key: "customer", label: "Customer", format: "text" },
            { key: "amount", label: "Amount", format: "currency" },
            { key: "date", label: "Date", format: "date" },
          ],
        },
      },
      {
        type: "Grid",
        props: { columns: 3, gap: "sm" },
        children: [
          { type: "Badge", props: { label: "Completed: 45", variant: "success" } },
          { type: "Badge", props: { label: "Pending: 3", variant: "warning" } },
          { type: "Badge", props: { label: "Cancelled: 2", variant: "error" } },
        ],
      },
    ],
  },

  mixed: {
    type: "Section",
    props: { title: "Full Demo" },
    children: [
      { type: "Alert", props: { message: "Welcome! This demonstrates all component types.", variant: "info", dismissible: true } },
      {
        type: "Grid",
        props: { columns: 2, gap: "lg" },
        children: [
          {
            type: "Card",
            props: { title: "Metrics" },
            children: [
              { type: "Metric", props: { label: "Revenue", valuePath: "/metrics/revenue", format: "currency", trend: "up" } },
              { type: "Metric", props: { label: "Growth", valuePath: "/metrics/growth", format: "percent", trend: "up" } },
              { type: "ProgressBar", props: { valuePath: "/metrics/salesProgress", max: 100, color: "blue" } },
            ],
          },
          {
            type: "Card",
            props: { title: "Quick Actions" },
            children: [
              { type: "Text", props: { content: "Choose an action:", variant: "body" } },
              { type: "Button", props: { label: "Export Data", action: { name: "export_data" }, variant: "primary" } },
              { type: "Button", props: { label: "Delete Item", action: { name: "delete_item", confirm: { title: "Confirm Delete", message: "Are you sure?", variant: "danger" } }, variant: "danger" } },
            ],
          },
        ],
      },
    ],
  },
};

// Convert nested to flat UITree format
const sampleTrees: Record<string, UITree> = Object.fromEntries(
  Object.entries(nestedTrees).map(([key, nested]) => [key, buildTree(nested)])
);

// Sample data for data binding
const initialData = {
  metrics: {
    revenue: 125000,
    growth: 0.15,
    customers: 1284,
    salesProgress: 73,
  },
  form: {
    name: "",
    email: "",
    topic: "",
    subscribe: false,
  },
  orders: [
    { id: "ORD-001", customer: "Acme Corp", amount: 2500, date: "2024-01-15" },
    { id: "ORD-002", customer: "Globex Inc", amount: 1800, date: "2024-01-14" },
    { id: "ORD-003", customer: "Initech", amount: 3200, date: "2024-01-13" },
    { id: "ORD-004", customer: "Umbrella Co", amount: 950, date: "2024-01-12" },
  ],
};

function App() {
  const [selectedTree, setSelectedTree] = useState<keyof typeof sampleTrees>("dashboard");
  const [data, setData] = useState(initialData);
  const [actionLog, setActionLog] = useState<string[]>([]);

  const handleDataChange = (path: string, value: unknown) => {
    // Update local state based on path
    setData((prev) => {
      const newData = { ...prev };
      const parts = path.split("/").filter(Boolean);
      let current: Record<string, unknown> = newData;
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = value;
      return newData;
    });
  };

  const handleAction = (action: Action) => {
    // Handle confirmation dialogs
    if (action.confirm) {
      if (!window.confirm(`${action.confirm.title}\n\n${action.confirm.message}`)) {
        return;
      }
    }

    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] Action: ${action.name}`;
    setActionLog((prev) => [...prev.slice(-4), logEntry]);

    // Handle specific actions
    switch (action.name) {
      case "reset_form":
        setData((prev) => ({
          ...prev,
          form: { name: "", email: "", topic: "", subscribe: false },
        }));
        break;
      case "submit_form":
        alert(`Form submitted!\n\nName: ${data.form.name}\nEmail: ${data.form.email}\nTopic: ${data.form.topic}\nSubscribe: ${data.form.subscribe}`);
        break;
      case "export_data":
        alert("Exporting data to CSV...");
        break;
      case "refresh_data":
        setData((prev) => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            revenue: prev.metrics.revenue + Math.floor(Math.random() * 1000),
            salesProgress: Math.min(100, prev.metrics.salesProgress + 1),
          },
        }));
        break;
      case "delete_item":
        alert("Item deleted!");
        break;
    }
  };

  // Create action handlers for the ActionProvider
  const actionHandlers: Record<string, () => void> = {
    export_data: () => handleAction({ name: "export_data" }),
    refresh_data: () => handleAction({ name: "refresh_data" }),
    submit_form: () => handleAction({ name: "submit_form" }),
    reset_form: () => handleAction({ name: "reset_form" }),
    delete_item: () => handleAction({ name: "delete_item" }),
  };

  return (
    <div className="app">
      <header className="header">
        <h1>json-render Demo</h1>
        <p>Safe AI-generated UIs from constrained JSON</p>
      </header>

      <nav className="nav">
        {Object.keys(sampleTrees).map((key) => (
          <button
            key={key}
            className={`nav-btn ${selectedTree === key ? "active" : ""}`}
            onClick={() => setSelectedTree(key as keyof typeof sampleTrees)}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </nav>

      <main className="main">
        <div className="render-area">
          <DataProvider initialData={data} onDataChange={handleDataChange}>
            <VisibilityProvider>
              <ActionProvider handlers={actionHandlers}>
                <Renderer
                  tree={sampleTrees[selectedTree]}
                  registry={componentRegistry}
                />
              </ActionProvider>
            </VisibilityProvider>
          </DataProvider>
        </div>

        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>Action Log</h3>
            <div className="action-log">
              {actionLog.length === 0 ? (
                <p className="log-empty">No actions yet</p>
              ) : (
                actionLog.map((log, i) => (
                  <div key={i} className="log-entry">{log}</div>
                ))
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Live Data</h3>
            <pre className="data-preview">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>

          <div className="sidebar-section">
            <h3>JSON Tree (Flat)</h3>
            <pre className="json-preview">
              {JSON.stringify(sampleTrees[selectedTree], null, 2)}
            </pre>
          </div>
        </aside>
      </main>

      <footer className="footer">
        <p>
          <a href="https://github.com/vercel-labs/json-render" target="_blank" rel="noopener">
            GitHub
          </a>
          {" · "}
          <a href="https://json-render.dev" target="_blank" rel="noopener">
            Documentation
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
