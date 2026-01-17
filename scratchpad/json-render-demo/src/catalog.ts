import { createCatalog } from "@json-render/core";
import { z } from "zod";

// Define the component catalog - this constrains what AI can generate
export const catalog = createCatalog({
  components: {
    // Layout components
    Card: {
      props: z.object({
        title: z.string(),
        subtitle: z.string().optional(),
      }),
      hasChildren: true,
    },
    Grid: {
      props: z.object({
        columns: z.number().min(1).max(4).default(2),
        gap: z.enum(["sm", "md", "lg"]).default("md"),
      }),
      hasChildren: true,
    },
    Section: {
      props: z.object({
        title: z.string(),
        collapsible: z.boolean().default(false),
      }),
      hasChildren: true,
    },

    // Data display components
    Metric: {
      props: z.object({
        label: z.string(),
        valuePath: z.string(),
        format: z.enum(["currency", "percent", "number", "text"]).default("text"),
        trend: z.enum(["up", "down", "neutral"]).optional(),
      }),
    },
    Text: {
      props: z.object({
        content: z.string(),
        variant: z.enum(["body", "heading", "caption", "code"]).default("body"),
      }),
    },
    Badge: {
      props: z.object({
        label: z.string(),
        variant: z.enum(["success", "warning", "error", "info"]).default("info"),
      }),
    },
    Alert: {
      props: z.object({
        message: z.string(),
        variant: z.enum(["success", "warning", "error", "info"]).default("info"),
        dismissible: z.boolean().default(false),
      }),
    },

    // Interactive components
    Button: {
      props: z.object({
        label: z.string(),
        action: z.any(), // ActionSchema - simplified for demo
        variant: z.enum(["primary", "secondary", "danger"]).default("primary"),
        disabled: z.boolean().default(false),
      }),
    },
    TextField: {
      props: z.object({
        label: z.string(),
        valuePath: z.string(),
        placeholder: z.string().optional(),
        type: z.enum(["text", "email", "number", "password"]).default("text"),
        checks: z.array(z.object({
          fn: z.enum(["required", "email", "minLength", "maxLength"]),
          message: z.string(),
          value: z.number().optional(),
        })).optional(),
        validateOn: z.enum(["change", "blur"]).default("blur"),
      }),
    },
    Select: {
      props: z.object({
        label: z.string(),
        valuePath: z.string(),
        options: z.array(z.object({
          value: z.string(),
          label: z.string(),
        })),
      }),
    },
    Checkbox: {
      props: z.object({
        label: z.string(),
        valuePath: z.string(),
      }),
    },

    // Data visualization
    ProgressBar: {
      props: z.object({
        valuePath: z.string(),
        max: z.number().default(100),
        label: z.string().optional(),
        color: z.enum(["blue", "green", "yellow", "red"]).default("blue"),
      }),
    },
    DataTable: {
      props: z.object({
        dataPath: z.string(),
        columns: z.array(z.object({
          key: z.string(),
          label: z.string(),
          format: z.enum(["text", "currency", "date", "number"]).default("text"),
        })),
      }),
    },
  },

  // Define available actions
  actions: {
    submit_form: { description: "Submit the current form data" },
    reset_form: { description: "Reset form to initial values" },
    export_data: { description: "Export data to CSV" },
    refresh_data: { description: "Refresh all data from server" },
    delete_item: { description: "Delete the selected item" },
    toggle_theme: { description: "Toggle dark/light theme" },
    show_details: { description: "Show detailed view" },
  },
});

export type Catalog = typeof catalog;
