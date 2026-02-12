import type { Meta, StoryObj } from "@storybook/react-vite";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const meta = {
  component: Tabs,
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="pt-2 text-xs text-muted-foreground">Overview content</p>
      </TabsContent>
      <TabsContent value="stats">
        <p className="pt-2 text-xs text-muted-foreground">Stats content</p>
      </TabsContent>
      <TabsContent value="settings">
        <p className="pt-2 text-xs text-muted-foreground">Settings content</p>
      </TabsContent>
    </Tabs>
  ),
};

export const Line: Story = {
  render: () => (
    <Tabs defaultValue="a">
      <TabsList variant="line">
        <TabsTrigger value="a">Tab A</TabsTrigger>
        <TabsTrigger value="b">Tab B</TabsTrigger>
        <TabsTrigger value="c">Tab C</TabsTrigger>
      </TabsList>
      <TabsContent value="a">
        <p className="pt-2 text-xs text-muted-foreground">Line variant content</p>
      </TabsContent>
      <TabsContent value="b">
        <p className="pt-2 text-xs text-muted-foreground">Tab B content</p>
      </TabsContent>
      <TabsContent value="c">
        <p className="pt-2 text-xs text-muted-foreground">Tab C content</p>
      </TabsContent>
    </Tabs>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Pill (default)</p>
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">Tab A</TabsTrigger>
            <TabsTrigger value="b">Tab B</TabsTrigger>
            <TabsTrigger value="c">Tab C</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Line</p>
        <Tabs defaultValue="a">
          <TabsList variant="line">
            <TabsTrigger value="a">Tab A</TabsTrigger>
            <TabsTrigger value="b">Tab B</TabsTrigger>
            <TabsTrigger value="c">Tab C</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  ),
};
